package clienthandlers

import (
	"fmt"
	"os"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

var (
	uploadLimit = 3
	uploadPass  = make(chan bool, uploadLimit)
)

func init() {
	for range uploadLimit {
		uploadPass <- true
	}
}

func uploadWithProgress(remoteFilePath, localFilePath string, wait chan bool) {
	<-uploadPass
	defer func() { uploadPass <- true }()

	c, err := GetNewConn()
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}
	defer c.Logout()

	localFile, err := os.Open(localFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}
	defer localFile.Close()

	remoteInfo, err := c.GetEntry(remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	if remoteInfo.Type == ftp.EntryTypeFolder {
		config.LogsCh <- fmt.Sprintf("\"%v\" is a remote folder, not a file. Cannot upload. Exiting...", remoteFilePath)
		return
	}

}
