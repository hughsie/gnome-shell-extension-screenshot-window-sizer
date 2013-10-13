/* Screenshot Window Sizer for Gnome Shell
 *
 * Copyright (c) 2013 Owen Taylor <otaylor@redhat.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Tweener = imports.ui.tweener;

const SETTINGS_SCHEMA = 'org.gnome.extensions.hughsie.screenshot-window-sizer';

let text, button;

function hideMessage() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function flashMessage(message, width, height, x, y) {
    if (!text) {
        text = new St.Label({ style_class: 'screenshot-sizer-message' });
        Main.uiGroup.add_actor(text);
    }

    Tweener.removeTweens(text);
    text.text = message;

    text.opacity = 255;

    text.set_position(Math.floor((width / 2 - text.width / 2) + x),
                      Math.floor((height / 2 - text.height / 2) + y));

    Tweener.addTween(text,
                     { opacity: 0,
                       time: 2,
                       transition: 'easeOutQuad',
                       onComplete: hideMessage });
}

let SIZES = [
    [624, 351],
    [800, 450],
    [1024, 576],
    [1200, 675],
    [1600, 900]
];

function cycleScreenshotSizes(display, screen, window, binding) {
    // Probably this isn't useful with 5 sizes, but you can decrease instead
    // of increase by holding down shift.
    let modifiers = binding.get_modifiers();
    let backwards = (modifiers & Meta.VirtualModifier.SHIFT_MASK) != 0;

    // Unmaximize first
    if (window.maximized_horizontally || window.maximizedVertically)
        window.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);

    let workArea = window.get_work_area_current_monitor();
    let outerRect = window.get_outer_rect();

    // Find the nearest 16:9 size for the current window size
    let nearestIndex;
    let nearestError;

    for (let i = 0; i < SIZES.length; i++) {
        let [width, height] = SIZES[i];
        let error = Math.abs(width - outerRect.width) + Math.abs(height - outerRect.height);
        if (nearestIndex == null || error < nearestError) {
            nearestIndex = i;
            nearestError = error;
        }
    }

    let newWidth, newHeight;
    let newIndex = nearestIndex;
    while (true) {
        newIndex = (newIndex + (backwards ? -1 : 1) + SIZES.length) % SIZES.length;
        [newWidth, newHeight] = SIZES[newIndex];
        if ((newWidth <= workArea.width && newHeight <= workArea.height) || newIndex == 0)
            break;
    }

    // Push the window onscreen if it would be resized offscreen
    let newX = outerRect.x;
    let newY = outerRect.y;
    if (newX + newWidth > workArea.x + workArea.width)
        newX = Math.max(workArea.x + workArea.width - newWidth);
    if (newY + newHeight > workArea.y + workArea.height)
        newY = Math.max(workArea.y + workArea.height - newHeight);

    window.move_resize_frame(true, newX, newY, newWidth, newHeight);

    let newOuterRect = window.get_outer_rect();
    let message = newOuterRect.width + 'x' + newOuterRect.height;

    // The new size might have been constrained by geometry hints (e.g. for
    // a terminal) - in that case, include the actual ratio to the message
    // we flash
    let actualNumerator = (newOuterRect.width / newOuterRect.height) * 9;
    if (Math.abs(actualNumerator - 16) > 0.01)
        message += ' (%.2f:9)'.format(actualNumerator);

    flashMessage(message, newOuterRect.width, newOuterRect.height, newX, newY);
}

let _settings;
function getSettings() {
    if (_settings == null) {
        let schemaSource;
        let extension = ExtensionUtils.getCurrentExtension();
        let schemaDir = extension.dir.get_child('schemas');
        schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir.get_path(),
                                                                    Gio.SettingsSchemaSource.get_default(),
                                                                    false);
        let schemaObj = schemaSource.lookup(SETTINGS_SCHEMA, true);
        if (!schemaObj)
            throw new Error('Schema ' + SETTINGS_SCHEMA + ' could not be found');

        _settings = new Gio.Settings({ settings_schema: schemaObj });
        log("Got settings");
    }

    return _settings;
}

function init() {
}

function enable() {
    Main.wm.addKeybinding('cycle-screenshot-sizes',
                          getSettings(),
                          Meta.KeyBindingFlags.PER_WINDOW | Meta.KeyBindingFlags.REVERSES,
                          Shell.KeyBindingMode.NORMAL,
                          cycleScreenshotSizes);
}

function disable() {
    Main.wm.removeKeybinding('cycle-screenshot-sizes');
    _settings = null;
}
