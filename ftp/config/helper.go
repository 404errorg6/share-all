package config

import (
	"encoding/json"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func GetHostPort(addr string) (string, string, error) {
	host, port, found := strings.Cut(addr, ":")
	if !found {
		LogsCh <- fmt.Sprintf("[FATAL]: %v doesn't contain \":\"", addr)
		return "", "", fmt.Errorf("\"%v\" doesn't contain \":\"", addr)
	}
	return host, port, nil
}

func SendJSON(w http.ResponseWriter, data any) {
	body, err := json.Marshal(data)
	if err != nil {
		LogsCh <- fmt.Sprintf("Error sending JSON: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write([]byte(body))
	w.WriteHeader(200)
}

func FolderExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		if os.IsExist(err) {
			return true
		}

		LogsCh <- err.Error()
		return false
	}

	return info.IsDir()
}

func GetContentType(fileName string) string {
	ext := filepath.Ext(fileName)
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return "application/octet-stream"
	}

	return contentType
}
