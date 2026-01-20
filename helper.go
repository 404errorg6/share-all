package main

import (
	"mime"
	"os"
	"path/filepath"
)

func folderExists(path string) bool {
	info, err := os.Stat(path)
	if os.IsExist(err) {
		return true
	}

	return info.IsDir()
}

func getContentType(fileName string) string {
	ext := filepath.Ext(fileName)
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return "application/octet-stream"
	}

	return contentType
}
