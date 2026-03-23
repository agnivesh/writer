use serde::Serialize;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, Runtime,
};

pub const MENU_NEW_FILE: &str = "new-file";
pub const MENU_OPEN_FILE: &str = "open-file";
pub const MENU_SAVE_FILE: &str = "save-file";
pub const MENU_SAVE_FILE_AS: &str = "save-file-as";

#[derive(Clone, Serialize)]
pub struct MenuActionPayload {
    pub action: String,
}

pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    let new_file = MenuItemBuilder::with_id(MENU_NEW_FILE, "New")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let open_file = MenuItemBuilder::with_id(MENU_OPEN_FILE, "Open...")
        .accelerator("CmdOrCtrl+O")
        .build(app)?;
    let save_file = MenuItemBuilder::with_id(MENU_SAVE_FILE, "Save")
        .accelerator("CmdOrCtrl+S")
        .build(app)?;
    let save_file_as = MenuItemBuilder::with_id(MENU_SAVE_FILE_AS, "Save As...")
        .accelerator("CmdOrCtrl+Shift+S")
        .build(app)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_file)
        .item(&open_file)
        .separator()
        .item(&save_file)
        .item(&save_file_as)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .cut()
        .copy()
        .paste()
        .separator()
        .select_all()
        .build()?;

    #[cfg(target_os = "macos")]
    {
        let app_menu = SubmenuBuilder::new(app, "Writer")
            .about(None)
            .separator()
            .services()
            .separator()
            .hide()
            .hide_others()
            .show_all()
            .separator()
            .quit()
            .build()?;

        return MenuBuilder::new(app)
            .item(&app_menu)
            .item(&file_menu)
            .item(&edit_menu)
            .build();
    }

    #[cfg(not(target_os = "macos"))]
    {
        MenuBuilder::new(app)
            .item(&file_menu)
            .item(&edit_menu)
            .build()
    }
}

pub fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        MENU_NEW_FILE | MENU_OPEN_FILE | MENU_SAVE_FILE | MENU_SAVE_FILE_AS => {
            let _ = app.emit(
                "menu-action",
                MenuActionPayload {
                    action: event.id().as_ref().to_string(),
                },
            );
        }
        _ => {}
    }
}
