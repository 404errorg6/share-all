package config

import (
	"encoding/json"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/jlaffaye/ftp"
)

func GetCompletePath(c *ftp.ServerConn, path string) (string, *ftp.Entry, error) {
	if path == "" {
		err := fmt.Errorf("path is required")
		return "", nil, err
	}

	//Check if file/folder is within accessible range
	entry, err := c.GetEntry(path) //Get from client's accessible filesystem
	if err != nil {
		return "", nil, err
	}

	//File/folder is safe to send now
	if !filepath.IsAbs(path) {
		path = filepath.Join(Server.RootDir, path)
	}
	return path, entry, nil
}

func GetHostPort(addr string) (string, string, error) {
	host, port, found := strings.Cut(addr, ":")
	if !found {
		err := fmt.Errorf("[INFO]: \":\" not found. Using \"%v\" as host", addr)
		LogsCh <- err.Error()
		return addr, "", err
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
