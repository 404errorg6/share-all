package clienthandlers

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
)

func downloadWithProgressBar(localFilePath, remoteFilePath string) { //Simply runs downloads
	<-downloadPass

	//Make new connection for each download
	c, err := GetNewConn()
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}
	defer c.Logout()

	remoteEntry, err := c.GetEntry(remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	if remoteEntry.Type == ftp.EntryTypeFolder {
		config.LogsCh <- fmt.Sprintf("\"%v\" is a folder, not a file. Cannot download. Exiting...", remoteFilePath)
	}

	remoteFile, err := c.Retr(remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}
	defer remoteFile.Close()

	err = os.MkdirAll(filepath.Dir(localFilePath), os.ModeDir)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	localFile, err := os.Create(localFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}
	defer localFile.Close()

	//Start tracking progress and download

	trackedLFile := progress.NewWriter(localFile)
	progressCh := progress.NewTicker(context.Background(), trackedLFile, int64(remoteEntry.Size), time.Second)
	fmt.Printf("Total size: %v\n", remoteEntry.Size)

	go startTracking(remoteEntry.Name, int64(remoteEntry.Size), true, progressCh)
	go func() {
		io.Copy(trackedLFile, remoteFile)
		downloadPass <- true
	}()
}
