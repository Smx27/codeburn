import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { AiInsightIndicator } from './indicator.js';

export default class AiInsightExtension extends Extension {
  _indicator = null;

  enable() {
    this._indicator = new AiInsightIndicator(this);
    Main.panel.addToStatusArea('aiinsight-indicator', this._indicator);
  }

  disable() {
    this._indicator?.destroy();
    this._indicator = null;
  }
}
