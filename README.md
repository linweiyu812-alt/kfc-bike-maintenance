# KFC Bike Maintenance

可直接部署到 GitHub Pages 的機車管理網站第一版。

## 功能
- Dashboard
- 每日車輛檢查
- 胎壓與功能異常判定
- 車輛管理
- 維修管理
- 手機 / 電腦 Responsive
- LocalStorage 儲存

## GitHub Pages 部署
1. 在 GitHub 建立 `kfc-bike-maintenance` repository。
2. 將本專案所有檔案上傳到 repository 根目錄。
3. 進入 `Settings > Pages`。
4. Source 選擇 `Deploy from a branch`。
5. Branch 選擇 `main`，Folder 選 `/ (root)`，按 Save。
6. 等待部署完成後即可使用 `https://你的帳號.github.io/kfc-bike-maintenance/`。

## 注意
目前為純 GitHub Pages 版本，資料只存在填寫者自己的瀏覽器，因此不同餐廳/電腦不會共用資料。
正式多人使用版本建議把資料層改接 Microsoft SharePoint List / Dataverse，並加入登入與權限。
