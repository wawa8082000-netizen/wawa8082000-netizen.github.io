// Publish the exact generated docs through GitHub's Git Data API.
// This avoids the Git receive-pack failures seen with bot git pushes.
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

module.exports = async ({ github, context, core }) => {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  git('add', '--all', '--', 'docs/');
  const changes = git('diff', '--cached', '--name-status', '--no-renames', '-z', '--', 'docs/')
    .split('\0').filter(Boolean);
  if (!changes.length) {
    core.info('Generated docs already match the repository.');
    return;
  }
  const repo = context.repo;
  const ref = 'heads/main';
  const head = (await github.rest.git.getRef({ ...repo, ref })).data.object.sha;
  if (head !== context.sha) {
    throw new Error('main changed during generation; rerun on the latest main to avoid publishing stale docs.');
  }
  const base = (await github.rest.git.getCommit({ ...repo, commit_sha: head })).data;
  const tree = [];
  for (let i = 0; i < changes.length; i += 2) {
    const [status, path] = changes.slice(i, i + 2);
    if (!path.startsWith('docs/')) throw new Error(`Unexpected path: ${path}`);
    let sha = null;
    if (status !== 'D') {
      sha = (await github.rest.git.createBlob({
        ...repo, content: readFileSync(path).toString('base64'), encoding: 'base64',
      })).data.sha;
    }
    tree.push({ path, mode: '100644', type: 'blob', sha });
  }
  const createdTree = (await github.rest.git.createTree({
    ...repo, base_tree: base.tree.sha, tree,
  })).data;
  const commit = (await github.rest.git.createCommit({
    ...repo, message: 'Sync generated docs from Excel [skip ci]',
    tree: createdTree.sha, parents: [head],
  })).data;
  await github.rest.git.updateRef({ ...repo, ref, sha: commit.sha, force: false });
  core.info(`Synced ${tree.length} generated file changes: ${commit.sha}`);
};
