import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd
from update_docs import ROOT, build


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copy(ROOT / 'template.html', self.root)
        (self.root / 'docs/images').mkdir(parents=True)
        (self.root / 'docs/images/线索 图.png').write_bytes(b'image-fixture')

    def build_rows(self, rows):
        with patch('update_docs.pd.read_excel', return_value={'1碑影迷踪': pd.DataFrame(rows)}):
            build(self.root)

    def test_images_text_escaping_and_static_asset_survival(self):
        self.build_rows([{'网址': 'image', '提示词': '<script>x</script>\n第二行', '图片地址': 'images/线索 图.png'},
                         {'网址': 'text', '提示词': '纯文字', '图片地址': ''},
                         {'网址': 'only-image', '提示词': '', '图片地址': 'https://example.com/clue.png'}])
        page = (self.root / 'docs/1碑影迷踪/image.html').read_text()
        self.assertIn('../images/%E7%BA%BF%E7%B4%A2%20%E5%9B%BE.png', page)
        self.assertIn('&lt;script&gt;x&lt;/script&gt;', page)
        self.assertIn('01:00', page)
        self.assertTrue((self.root / 'docs/images/线索 图.png').exists())
        self.assertEqual(page, (self.root / 'docs/1隐秘的见证/image.html').read_text())
        self.assertNotIn('<img ', (self.root / 'docs/1碑影迷踪/text.html').read_text())
        self.assertIn('<img ', (self.root / 'docs/1碑影迷踪/only-image.html').read_text())

    def test_invalid_images_do_not_replace_existing_pages(self):
        existing = self.root / 'docs/existing.html'
        existing.write_text('keep')
        for value in ['images/missing.png', '../outside.png', 'javascript:alert(1)', '//example.com/image.png']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.build_rows([{'网址': 'bad', '提示词': '', '图片地址': value}])
            self.assertEqual(existing.read_text(), 'keep')

    def test_old_two_column_workbooks_and_blank_rows(self):
        self.build_rows([{'网址': 'text', '提示词': '旧表格式'}, {'网址': '', '提示词': ''}])
        self.assertTrue((self.root / 'docs/1碑影迷踪/text.html').exists())


if __name__ == '__main__':
    unittest.main()
