# 线索静态网页

`info.xlsx` → `scripts/update_docs.py` → `template.html` → `docs/` → GitHub Pages。

每张工作表是一个章节；每行的“网址”生成同名 HTML，“提示词”是等待结束后显示的文字。所有页面罚时为 1 分钟，文字换行会保留。图片和文字一起在计时结束后显示，点击图片可以查看原图。

## 更新图片

1. 将图片放入 `docs/images/`，例如 `docs/images/ch1-3-3.png`。
2. 在 Excel 对应行的“图片地址”填写 `images/ch1-3-3.png`（相对于 `docs/`），也支持完整的 HTTPS 图片地址。
3. 纯文字线索留空；纯图片线索可将“提示词”留空。不要把 HTML 放入提示词。
4. 提交 Excel、图片、模板或脚本的变更，Actions 自动重新生成并部署。生成时会保留图片等静态资源；缺失的本地图片会导致构建失败。

本地生成：`python scripts/update_docs.py`。依赖：`pandas openpyxl jinja2`。验证：`python -m unittest discover -s scripts`。

## 本次数据来源

已按 `info(9).numbers` 更新为“1碑影迷踪”的 16 条线索，并保留“2消失的龙”空章节；原始 Excel 保存在 `archive/info-before-numbers.xlsx`。已有“1隐秘的见证”目录下、仍有对应行的链接继续提供新版内容，兼容原二维码。Numbers 已删除的 `ch1-9-1`、`ch1-9-2` 不再生成。

提供的 Numbers 文件中未发现线索图片；目前“图片地址”留空。`ch1-3-2` 文案提到“求助提示3”，但源表没有对应行，需补充图片及归属后再填写，不猜测或替换其内容。
