package clienthandlers

import (
	"context"
	"fmt"
	"os"
	"path"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
)

func uploadWithProgress(remoteFilePath, localFilePath string) {
	<-uploadPass

	//Confirm these are files (have trust issues with caller)
	c, err := GetNewConn()
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	localEntry, err := os.Lstat(localFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	if localEntry.IsDir() {
		config.LogsCh <- fmt.Sprintf("\"%v\" is a local folder, not a file. Cannot upload folder. Exiting...", localFilePath)
		return
	}

	localFile, err := os.Open(localFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	remoteEntry, err := c.GetEntry(path.Dir(remoteFilePath))
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	if remoteEntry.Type != ftp.EntryTypeFolder {
		config.LogsCh <- fmt.Sprintf("\"%v\" is not a remote folder. Cannot upload file. Exiting...", remoteFilePath)
		return
	}

	// Start with progress info
	trackedFile := progress.NewReader(localFile)
	progressCh := progress.NewTicker(context.Background(), trackedFile, localEntry.Size(), time.Second)

	go startTracking(localEntry.Name(), localEntry.Size(), false, progressCh)
	go func() {
		c.Stor(remoteFilePath, trackedFile)

		uploadPass <- true
		c.Logout()
		localFile.Close()
	}()
}
