# Cài đặt & chuẩn bị

## ⚡ Cách nhanh nhất — chạy 1 script (khi cài lại máy Ubuntu)

```bash
bash ~/thai/system/nvim/install.sh
```

Script tự làm hết: cài `ripgrep`/`fd`/`fzf`/`nodejs`/`golang`/`build-essential`, cài Neovim mới nhất, symlink config, rồi tải plugin + LSP server. An toàn chạy lại nhiều lần.

> Cần `sudo` (script sẽ hỏi mật khẩu). Sau khi xong, mở `nvim` là dùng được.

Nếu muốn làm **thủ công từng bước**, xem bên dưới.

---

## 1. Nâng Neovim lên 0.11 (đang có 0.9.5)

Vài plugin (LSP API mới, treesitter, flash) cần Neovim ≥ 0.10. Cài bản mới nhất qua tarball chính thức (sạch, không đụng bản apt):

```bash
# Tải bản stable mới nhất
curl -LO https://github.com/neovim/neovim/releases/download/stable/nvim-linux-x86_64.tar.gz

# Giải nén vào /opt
sudo rm -rf /opt/nvim
sudo tar -C /opt -xzf nvim-linux-x86_64.tar.gz
sudo mv /opt/nvim-linux-x86_64 /opt/nvim

# Tạo lệnh `nvim` ưu tiên bản mới
sudo ln -sf /opt/nvim/bin/nvim /usr/local/bin/nvim

# Dọn file tải
rm nvim-linux-x86_64.tar.gz

# Kiểm tra
nvim --version   # phải thấy v0.11.x
```

> Nếu vẫn ra 0.9.5: chạy `hash -r` (hoặc mở terminal mới) rồi thử lại — shell đang cache đường dẫn cũ.

## 2. Cài `fd` (fzf-lua tìm file nhanh hơn)

```bash
sudo apt install -y fd-find
# Ubuntu đặt tên là `fdfind`; tạo alias `fd`:
mkdir -p ~/.local/bin && ln -sf "$(which fdfind)" ~/.local/bin/fd
# đảm bảo ~/.local/bin nằm trong PATH
```

`ripgrep` (`rg`) và `git` đã có sẵn trên máy.

## 3. Kích hoạt config

```bash
# Symlink thư mục repo này thành config Neovim
ln -s ~/thai/system/nvim ~/.config/nvim

# Mở nvim — lần đầu lazy.nvim tự tải plugin, mason tự tải LSP server.
# Chờ vài chục giây, xong thoát ra (:q) rồi mở lại.
nvim
```

## 4. Kiểm tra sức khoẻ

Trong nvim chạy:
```
:checkhealth
:Lazy          " xem plugin đã cài
:Mason         " xem LSP server đã tải (ts_ls, pyright, gopls, lua_ls)
```
