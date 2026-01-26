package clienthandlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleDownload(w http.ResponseWriter, req *http.Request) {
	var isFolder bool
	localPath := req.FormValue("local_path")
	remotePath := req.FormValue("remote_path")

	if remotePath == "" || localPath == "" {
		http.Error(w, "remote_path/local_path are required", http.StatusBadRequest)
		return
	}

	localPath = config.ResolveLocalPath(localPath)
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	if config.RemoteFolderExists(remotePath, c) {
		isFolder = true
	}

	if !isFolder {
		err := downloadFile(localPath, remotePath, c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if isFolder {
		err := downloadDir(localPath, remotePath, c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

func downloadDir(localPath, remotePath string, c *ftp.ServerConn) error {
	dirName := filepath.Base(remotePath)
	updatedLocalPath := filepath.Join(localPath, dirName) //Add remote dir

	remoteDir, err := c.List(remotePath)
	if err != nil {
		return err
	}

	for _, e := range remoteDir {

		if e.Type == ftp.EntryTypeFile { //Download files
			remoteFilePath := filepath.Join(remotePath, e.Name)
			err := downloadFile(updatedLocalPath, remoteFilePath, c)
			if err != nil {
				return err
			}
		}

		if e.Type == ftp.EntryTypeFolder { //Download folders
			newRemotePath := filepath.Join(remotePath, e.Name)
			err := downloadDir(updatedLocalPath, newRemotePath, c)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func downloadFile(localDirPath, remoteFilePath string, c *ftp.ServerConn) error { //Downloads remote file at remoteFilePath to local storage in localDirPath
	fileName := filepath.Base(remoteFilePath)
	remoteFile, err := c.Retr(remoteFilePath)
	if err != nil {
		return err
	}

	err = os.MkdirAll(localDirPath, os.ModeDir)
	if err != nil {
		return err
	}

	localFile, err := os.Create(filepath.Join(localDirPath, fileName))
	if err != nil {
		return err
	}
	defer localFile.Close()

	_, err = io.Copy(localFile, remoteFile)
	if err != nil {
		return err
	}

	return nil
}
