package config

import (
	"encoding/json"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/jlaffaye/ftp"
)

func ResolveRemotePath(c *ftp.ServerConn, remotePath string) (string, *ftp.Entry, error) {
	if remotePath == "" {
		return ".", nil, nil
	}

	remotePath = filepath.ToSlash(remotePath)

	//Check if file/folder is within accessible range
	entry, err := c.GetEntry(remotePath) //Get from client's accessible filesystem
	if err != nil {
		return "", nil, err
	}

	/*	if entry.Type == ftp.EntryTypeFile {
			// Attempt to list the path. If it works, it's a directory.
			entries, err := c.List(remotePath)
			if err == nil && len(entries) > 0 {
				// If the name of the first item is the SAME as our file,
				// and the server says it's a file, it's definitely a file.
				if entries[0].Name == path.Base(remotePath) && entries[0].Type == ftp.EntryTypeFile {
					entry.Type = ftp.EntryTypeFile
				} else {
					// If List returns multiple items or the type is folder, it's a folder
					entry.Type = ftp.EntryTypeFolder
				}
			}
		}
	*/
	//File/folder is safe to send now
	if !filepath.IsAbs(remotePath) {
		remotePath = path.Join(Server.RootDir, remotePath)
	}
	return remotePath, entry, nil
}

func ResolveLocalPath(localPath string) string {
	localPath = filepath.ToSlash(localPath)
	if localPath == "" {
		return DefLocalDir
	}

	if filepath.IsAbs(localPath) {
		return filepath.Clean(localPath)
	}

	return filepath.Join(DefLocalDir, localPath)
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

func RemoteFolderExists(remotePath string, c *ftp.ServerConn) bool {
	info, err := c.GetEntry(remotePath)
	if err != nil {
		return false
	}

	if info.Type == ftp.EntryTypeFolder {
		return true
	}

	return false
}

func LocalFolderExists(localPath string) bool {
	info, err := os.Stat(localPath)
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
