package clienthandlers

import (
	"fmt"
	"os"
	"time"

	"github.com/jlaffaye/ftp"
)

var (
	savedConn, _ = GetNewConn()
)

func GetNewConn() (*ftp.ServerConn, error) {
	c, err := ftp.Dial(verifiedAddr, ftp.DialWithTimeout(5*time.Second))
	if err != nil {
		return nil, err
	}

	err = c.Login(verifiedUser, verifiedPass)
	if err != nil {
		return nil, err
	}

	return c, nil
}

func areFiles(localFilePath, remoteFilePath string) error { //Checks if the remote and local paths are files, must be authenticated for remote test
	var isRemoteFile bool
	var isLocalFile bool

	if savedConn == nil {
		var err error
		savedConn, err = GetNewConn()
		if err != nil {
			return err
		}
	}

	if remoteFilePath == "" {
		isRemoteFile = true
	}

	if localFilePath == "" {
		isLocalFile = true
	}

	if !isRemoteFile {
		e, err := savedConn.GetEntry(remoteFilePath)
		if err != nil {
			return err
		}

		if e.Type != ftp.EntryTypeFolder {
			isRemoteFile = true
		}
	}

	if !isLocalFile {
		_, err := os.ReadFile(localFilePath)
		if err == nil {
			isLocalFile = true
		}
	}

	if !isLocalFile {
		return fmt.Errorf("\"%v\" is not a file", localFilePath)
	}

	if !isRemoteFile {
		return fmt.Errorf("\"%v\" is not a file", remoteFilePath)
	}

	return nil
}
