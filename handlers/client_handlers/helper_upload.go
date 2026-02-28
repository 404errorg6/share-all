package clienthandlers

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
)

func uploadWithProgress(remoteFilePath, localFilePath string, wait chan bool) {
	<-uploadPass
	defer func() { uploadPass <- true }()

	//Confirm these are files (have trust issues with caller)

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

	if remoteInfo.Type != ftp.EntryTypeFolder {
		config.LogsCh <- fmt.Sprintf("\"%v\" is not a remote folder. Cannot upload file. Exiting...", remoteFilePath)
		return
	}

	localEntry, err := os.Lstat(localFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	wait <- false

	// Start with progress info
	trackedFile := progress.NewReader(localFile)
	progressCh := progress.NewTicker(context.Background(), trackedFile, localEntry.Size(), time.Second)

	startTracking(localEntry.Name(), localEntry.Size(), false, progressCh)

	c.Stor(remoteFilePath, trackedFile)
}
