package clienthandlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleUpload(w http.ResponseWriter, req *http.Request) {
	localPath := req.FormValue("local_path")
	remotePath := req.FormValue("remote_path")

	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	if localPath == "" || remotePath == "" {
		http.Error(w, "local_path/remote_path are required", http.StatusBadRequest)
		return
	}

	localPath = config.ResolveLocalPath(localPath)
	info, err := os.Stat(localPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if info.IsDir() {
		err := uploadDir(remotePath, localPath, c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		err := uploadFile(remotePath, localPath, c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

func uploadDir(remoteDirPath, localDirPath string, c *ftp.ServerConn) error {
	dirName := filepath.Base(localDirPath)
	localDirPath = config.ResolveLocalPath(localDirPath)
	remoteDirPath, remoteEntry, err := config.ResolveRemotePath(c, remoteDirPath)
	if err != nil {
		return err
	}

	localEntry, err := os.Lstat(localDirPath)
	if err != nil {
		return err
	}

	if !localEntry.IsDir() {
		return fmt.Errorf("\"%v\" is a file, not a local directory", localDirPath)
	}

	if remoteEntry.Type != ftp.EntryTypeFolder {
		return fmt.Errorf("\"%v\" is a file, not a remote directory", remoteDirPath)
	}

	updatedRemoteDirPath := filepath.Join(remoteDirPath, dirName)
	err = c.MakeDir(updatedRemoteDirPath)
	if err != nil {
		return err
	}

	localDir, err := os.ReadDir(localDirPath)
	if err != nil {
		return err
	}

	for _, e := range localDir {
		if e.Type().IsDir() {
			updatedLocalDirPath := filepath.Join(localDirPath, e.Name())

			err := uploadDir(remoteDirPath, updatedLocalDirPath, c)
			if err != nil {
				return err
			}

		} else {
			localFilePath := filepath.Join(localDirPath, e.Name())

			err := uploadFile(remoteDirPath, localFilePath, c)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func uploadFile(remoteDirPath, localFilePath string, c *ftp.ServerConn) error {
	localFilePath = config.ResolveLocalPath(localFilePath)
	remoteDirPath, entry, err := config.ResolveRemotePath(c, remoteDirPath)
	if err != nil {
		return err
	}

	if entry.Type != ftp.EntryTypeFolder {
		err := fmt.Errorf("\"%v\" is a file, not a remote directory", remoteDirPath)
		return err
	}

	file, err := os.Open(localFilePath)
	if err != nil {
		return err
	}

	info, err := file.Stat()
	if err != nil {
		return err
	}

	if info.IsDir() {
		err := fmt.Errorf("\"%v\" is a directory, not a local file", localFilePath)
		return err
	}

	err = c.Stor(remoteDirPath, file)
	if err != nil {
		return err
	}

	return nil
}
