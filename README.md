# alphaJxiv
- Jxivでディスカッションできる拡張機能 (alphaXivさんのマネ)
- 背景とか意図とか詳しくは[wiki](https://github.com/yuyuslab/alphaJxiv/wiki)にて
---
# 主な機能（06/08/2025 現在）
1. 現状は Chrome 拡張機能である
2. [Jxiv](https://jxiv.jst.go.jp/index.php/jxiv)の PDF の隣にサイドバーを設ける
3. Google アカウント認証後に Jxiv で PDF を表示するページにてコメントができる
---
# ローカル環境でこのプロジェクトを動作させる方法
1. 作業ディレクトリにて `git clone git@github.com:yuyuslab/alphaJxiv.git`
2. Chrome ブラウザを開く
    - フルスクリーンだと Google アカウントの認証で出てくるウィンドウが自動で切り替わるのでオススメ
    - そうでなければ出てくる認証画面ウィンドウに手動で切り替える必要がある
3. `chrome://extensions/` のページにいく
4 右上の "Developer mode" をオン
5. "Load unpacked" より alphaJxiv の `dist` フォルダーをアップロード
6. Jxiv でテキトウなページを開く (e.g. https://jxiv.jst.go.jp/index.php/jxiv/preprint/view/1295/3422)
7. 拡張機能のアイコンをクリックしてサイドバーを開く
8. "Login with Google" をクリック
9. 認証画面のウィンドウが開くので (フルスクリーンでは新しく開いたウィンドウを探して) アカウントを選択
10. Jxiv に勝手に or 手動で戻ってコメントをする
---
# 問題・改善点は [Issue](https://github.com/yuyuslab/alphaJxiv/issues) にて
このプロジェクトは Firebase の無料枠でやっており，プロジェクトに支払いアカウントは紐づいておりません
