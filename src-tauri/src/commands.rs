use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::Serialize;
use tauri::{AppHandle, Manager, Theme};
use tauri_plugin_dialog::{DialogExt, FilePath};
use thiserror::Error;

#[derive(Debug, Serialize)]
pub struct OpenFilePayload {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct SaveFilePayload {
    pub path: String,
}

#[derive(Debug, Error)]
pub enum CommandError {
    #[error("Selected file path is not a local filesystem path")]
    NonLocalPath,
    #[error("A valid file path is required")]
    EmptyPath,
    #[error("The selected path points to a directory, not a file")]
    DirectoryPath,
    #[error("Parent directory does not exist: {0}")]
    MissingParentDirectory(String),
    #[error("Main application window is unavailable")]
    MissingWindow,
    #[error("{0}")]
    Io(String),
}

impl serde::Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[tauri::command]
pub async fn open_markdown_file(app: AppHandle) -> Result<Option<OpenFilePayload>, CommandError> {
    let selected_file = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .blocking_pick_file();

    let Some(selected_file) = selected_file else {
        return Ok(None);
    };

    let path = dialog_path_to_pathbuf(selected_file)?;
    Ok(Some(read_markdown_file(&path)?))
}

#[tauri::command]
pub async fn save_markdown_file(
    path: String,
    content: String,
) -> Result<SaveFilePayload, CommandError> {
    let path = normalize_save_path(PathBuf::from(path))?;
    write_markdown_file(&path, &content)
}

#[tauri::command]
pub async fn save_markdown_file_as(
    app: AppHandle,
    content: String,
) -> Result<Option<SaveFilePayload>, CommandError> {
    let selected_file = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown"])
        .set_file_name("untitled.md")
        .blocking_save_file();

    let Some(selected_file) = selected_file else {
        return Ok(None);
    };

    let path = normalize_save_path(dialog_path_to_pathbuf(selected_file)?)?;
    Ok(Some(write_markdown_file(&path, &content)?))
}

#[tauri::command]
pub fn read_app_theme(app: AppHandle) -> Result<String, CommandError> {
    let window = app
        .get_webview_window("main")
        .ok_or(CommandError::MissingWindow)?;

    let theme = match window.theme().unwrap_or(Theme::Light) {
        Theme::Light => "light",
        Theme::Dark => "dark",
        _ => "system",
    };

    Ok(theme.to_string())
}

fn dialog_path_to_pathbuf(file_path: FilePath) -> Result<PathBuf, CommandError> {
    file_path
        .simplified()
        .into_path()
        .map_err(|_| CommandError::NonLocalPath)
}

fn normalize_save_path(path: PathBuf) -> Result<PathBuf, CommandError> {
    if path.as_os_str().is_empty() {
        return Err(CommandError::EmptyPath);
    }

    if path.is_dir() {
        return Err(CommandError::DirectoryPath);
    }

    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            return Err(CommandError::MissingParentDirectory(
                parent.display().to_string(),
            ));
        }
    }

    if path.extension().is_none() {
        Ok(path.with_extension("md"))
    } else {
        Ok(path)
    }
}

fn read_markdown_file(path: &Path) -> Result<OpenFilePayload, CommandError> {
    let content = fs::read_to_string(path)
        .map_err(|error| CommandError::Io(format!("Failed to read {}: {error}", path.display())))?;

    Ok(OpenFilePayload {
        path: path.display().to_string(),
        content,
    })
}

fn write_markdown_file(path: &Path, content: &str) -> Result<SaveFilePayload, CommandError> {
    if path.is_dir() {
        return Err(CommandError::DirectoryPath);
    }

    fs::write(path, content)
        .map_err(|error| CommandError::Io(format!("Failed to write {}: {error}", path.display())))?;

    Ok(SaveFilePayload {
        path: path.display().to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::{normalize_save_path, read_markdown_file, write_markdown_file};
    use std::{fs, path::PathBuf};
    use tempfile::tempdir;

    #[test]
    fn adds_markdown_extension_when_missing() {
        let temp_dir = tempdir().unwrap();
        let path = temp_dir.path().join("draft");

        let normalized = normalize_save_path(path).unwrap();

        assert_eq!(normalized.extension().unwrap(), "md");
    }

    #[test]
    fn rejects_missing_parent_directories() {
        let path = PathBuf::from("C:/definitely-missing-writer-dir/file.md");
        let error = normalize_save_path(path).unwrap_err();

        assert!(error.to_string().contains("Parent directory does not exist"));
    }

    #[test]
    fn writes_and_reads_markdown_content() {
        let temp_dir = tempdir().unwrap();
        let path = temp_dir.path().join("draft.md");

        write_markdown_file(&path, "# Draft").unwrap();
        let saved = read_markdown_file(&path).unwrap();

        assert_eq!(saved.content, "# Draft");
        assert_eq!(saved.path, path.display().to_string());
    }

    #[test]
    fn rejects_directory_write_targets() {
        let temp_dir = tempdir().unwrap();
        let error = write_markdown_file(temp_dir.path(), "content").unwrap_err();

        assert_eq!(error.to_string(), "The selected path points to a directory, not a file");
    }

    #[test]
    fn reads_existing_file_contents() {
        let temp_dir = tempdir().unwrap();
        let path = temp_dir.path().join("article.md");
        fs::write(&path, "## Body").unwrap();

        let file = read_markdown_file(&path).unwrap();

        assert_eq!(file.content, "## Body");
    }
}
