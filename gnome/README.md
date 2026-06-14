# AiInsight GNOME Extension

Monitor AI coding assistant token usage and costs from your GNOME desktop panel.

## Requirements

- GNOME Shell 45 or later
- AiInsight CLI installed (`npm i -g aiinsight`)
- `glib-compile-schemas` (usually part of `glib2-devel` or `libglib2.0-dev`)

## Install

```bash
cd gnome
chmod +x install.sh
./install.sh
```

Then restart GNOME Shell:
- **Wayland:** Log out and back in
- **X11:** Press `Alt+F2`, type `r`, press Enter

Enable the extension:

```bash
gnome-extensions enable aiinsight@aiinsight.dev
```

## Configure

Open preferences:

```bash
gnome-extensions prefs aiinsight@aiinsight.dev
```

Or use the GNOME Extensions app.

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Refresh Interval | 30s | How often to poll AiInsight CLI |
| Default Period | Today | Period shown on open |
| Compact Mode | Off | Hide cost label, show icon only |
| Budget Threshold | $0 | Daily budget alert (0 = disabled) |
| Budget Alerts | Off | Show warning when budget exceeded |
| CLI Path | (auto) | Custom path to `aiinsight` binary |

## Uninstall

```bash
gnome-extensions disable aiinsight@aiinsight.dev
rm -r ~/.local/share/gnome-shell/extensions/aiinsight@aiinsight.dev
```

## Development

Test changes without installing:

```bash
# Compile schemas locally
glib-compile-schemas schemas/

# Symlink for development
ln -sf "$(pwd)" ~/.local/share/gnome-shell/extensions/aiinsight@aiinsight.dev

# Watch logs
journalctl -f -o cat /usr/bin/gnome-shell
```
