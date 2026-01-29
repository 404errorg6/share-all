package clienthandlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleDownload(w http.ResponseWriter, req *http.Request) {
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

	err = smartDownload(localPath, remotePath, c)
	if err != nil {
		if strings.Contains(err.Error(), "226") { //Treat 226 closing connection as a success instead of error
			w.WriteHeader(http.StatusNoContent)
			return
		}

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func smartDownload(localDirPath, remotePath string, c *ftp.ServerConn) error { //Choose whether to download dir or file
	// 1. Resolve the remote path once at the start
	localDirPath = config.ResolveLocalPath(localDirPath)
	remotePath, remoteEntry, err := config.ResolveRemotePath(c, remotePath)
	if err != nil {
		return err
	}

	// 2. Decide what to do based on entry type
	if remoteEntry.Type == ftp.EntryTypeFolder {
		fmt.Printf("Detected directory: %s. Starting recursive download...\n", remotePath)
		return downloadDir(localDirPath, remotePath, c)
	}

	fmt.Printf("Detected file: %s. Starting file download...\n", remotePath)
	return downloadFile(localDirPath, remotePath, c)
}

func downloadDir(localDirPath, remoteDirPath string, c *ftp.ServerConn) error {
	dirName := path.Base(remoteDirPath)
	updatedLocalPath := filepath.Join(localDirPath, dirName)

	remoteEntry, err := c.GetEntry(remoteDirPath)
	if err != nil {
		return err
	}

	if remoteEntry.Type != ftp.EntryTypeFolder {
		return fmt.Errorf("\"%v\" is a file, not a remote directory", remoteDirPath)
	}

	remoteDir, err := c.List(remoteDirPath)
	if err != nil {
		return err
	}

	for _, e := range remoteDir {

		if e.Name == "." || e.Name == ".." {
			continue
		}

		fmt.Printf("Downloading: %v\n", e.Name)

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
	fileName := path.Base(remoteFilePath)
	filePath := filepath.Join(localDirPath, fileName)

	remoteEntry, err := c.GetEntry(remoteFilePath)
	if err != nil {
		return err
	}

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
	defer remoteFile.Close()

	_, err = io.Copy(localFile, remoteFile)
	if err != nil {
		return err
	}

	return nil
}
