package clienthandlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleDownload(w http.ResponseWriter, req *http.Request) {
	var isFolder bool
	localPath := req.FormValue("local_path")
	remotePath := req.FormValue("remote_path")

	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	if remotePath == "" || localPath == "" {
		http.Error(w, "remote_path/local_path are required", http.StatusBadRequest)
		return
	}

	localPath = config.ResolveLocalPath(localPath)
	remotePath, remoteEntry, err := config.ResolveRemotePath(c, remotePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if remoteEntry.Type == ftp.EntryTypeFolder {
		isFolder = true
	} else {
		isFolder = false
	}

	if isFolder {
		err := downloadDir(localPath, remotePath, c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

	} else {
		err := downloadFile(localPath, remotePath, c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

func downloadDir(localDirPath, remoteDirPath string, c *ftp.ServerConn) error {
	localDirPath = config.ResolveLocalPath(localDirPath)
	remoteDirPath, remoteEntry, err := config.ResolveRemotePath(c, remoteDirPath)
	if err != nil {
		return err
	}

	dirName := path.Base(remoteDirPath)
	updatedLocalPath := filepath.Join(localDirPath, dirName)

	if remoteEntry.Type != ftp.EntryTypeFolder {
		return fmt.Errorf("\"%v\" is a file, not a remote directory", remoteDirPath)
	}

	remoteDir, err := c.List(remoteDirPath)
	if err != nil {
		return err
	}

	for _, e := range remoteDir {

		if e.Type == ftp.EntryTypeFile { //Download files
			remoteFilePath := path.Join(remoteDirPath, e.Name)
			err := downloadFile(updatedLocalPath, remoteFilePath, c)
			if err != nil {
				return err
			}
		}

		if e.Type == ftp.EntryTypeFolder { //Download folders
			newRemotePath := path.Join(remoteDirPath, e.Name)
			err := downloadDir(updatedLocalPath, newRemotePath, c)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func downloadFile(localDirPath, remoteFilePath string, c *ftp.ServerConn) error { //Downloads remote file at remoteFilePath to local storage in localDirPath
	localDirPath = config.ResolveLocalPath(localDirPath)
	remoteFilePath, remoteEntry, err := config.ResolveRemotePath(c, remoteFilePath)
	if err != nil {
		return err
	}

	fileName := path.Base(remoteFilePath)
	filePath := filepath.Join(localDirPath, fileName)

	if remoteEntry.Type == ftp.EntryTypeFolder {
		return fmt.Errorf("\"%v\" is a directory, not a remote file", remoteFilePath)
	}

	err = os.MkdirAll(localDirPath, os.ModeDir)
	if err != nil {
		return err
	}

	localFile, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer localFile.Close()

	remoteFile, err := c.Retr(remoteFilePath)
	if err != nil {
		return err
	}

	_, err = io.Copy(localFile, remoteFile)
	if err != nil {
		return err
	}

	return nil
}
