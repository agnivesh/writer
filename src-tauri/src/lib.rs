mod commands;
mod menu;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::open_markdown_file,
            commands::save_markdown_file,
            commands::save_markdown_file_as,
            commands::read_app_theme
        ])
        .setup(|app| {
            let menu = menu::build_menu(&app.handle())?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(menu::handle_menu_event)
        .run(tauri::generate_context!())
        .expect("failed to run Writer");
}
