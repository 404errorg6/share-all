package clienthandlers

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

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

	err = smartUpload(remotePath, localPath, c)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func smartUpload(remotePath, localPath string, c *ftp.ServerConn) error {
	localPath = config.ResolveLocalPath(localPath)
	remotePath, _, err := config.ResolveRemotePath(c, remotePath)
	if err != nil {
		return err
	}

	info, err := os.Stat(localPath)
	if err != nil {
		return err
	}

	if info.IsDir() {
		return uploadDir(remotePath, localPath, c)
	}

	return uploadFile(remotePath, localPath, c)
}

func uploadDir(remoteDirPath, localDirPath string, c *ftp.ServerConn) error {
	dirName := filepath.Base(localDirPath)
	remoteEntry, err := c.GetEntry(remoteDirPath)
	if err != nil {
		return err
	}

	localEntry, err := os.Lstat(localDirPath)
	if err != nil {
		return err
	}

	//Check if remoteDirPath and localDirPath are really dirs
	if !localEntry.IsDir() {
		return fmt.Errorf("\"%v\" is a file, not a local directory", localDirPath)
	}

	if remoteEntry.Type != ftp.EntryTypeFolder {
		return fmt.Errorf("\"%v\" is a file, not a remote directory", remoteDirPath)
	}

	updatedRemoteDirPath := path.Join(remoteDirPath, dirName)
	err = c.MakeDir(updatedRemoteDirPath)
	if err != nil && !strings.Contains(err.Error(), "file exists") {
		return err
	}

	localDir, err := os.ReadDir(localDirPath)
	if err != nil {
		return err
	}

	for _, e := range localDir {
		if e.Name() == "." || e.Name() == ".." {
			continue
		}

		//Handle dir upload
		if e.Type().IsDir() {
			updatedLocalDirPath := filepath.Join(localDirPath, e.Name())

			err := uploadDir(updatedRemoteDirPath, updatedLocalDirPath, c)
			if err != nil {
				return err
			}

			continue
		}

		//Handle file upload
		localFilePath := filepath.Join(localDirPath, e.Name())

		err := uploadFile(updatedRemoteDirPath, localFilePath, c)
		if err != nil {
			return err
		}
	}

	return nil
}

func uploadFile(remoteDirPath, localFilePath string, c *ftp.ServerConn) error {
	fileName := filepath.Base(localFilePath)
	remoteFilePath := path.Join(remoteDirPath, fileName)

	remoteEntry, err := c.GetEntry(remoteDirPath)
	if err != nil {
		return err
	}

	if remoteEntry.Type != ftp.EntryTypeFolder {
		err := fmt.Errorf("\"%v\" is a file, not a remote directory", remoteDirPath)
		return err
	}

	localEntry, err := os.Stat(localFilePath)
	if err != nil {
		return err
	}

	if localEntry.IsDir() {
		err := fmt.Errorf("\"%v\" is a directory, not a local file", localFilePath)
		return err
	}

	uploadWithProgress(remoteFilePath, localFilePath)

	// TODO: Remove this later if nothing breaks
	//Reassign a fresh connection

	/*
		c.Logout()
		c, err = GetNewConn()
		if err != nil {
			return err
		}
	*/
	return nil
}
