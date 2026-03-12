package clienthandlers

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"changeme/internal/config"
	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
)

var downloadConn *ftp.ServerConn

func downloadWithProgressBar(localFilePath, remoteFilePath string) { //Starts and tracks downloads in parallel
	if downloadConn == nil {
		var err error
		downloadConn, err = GetNewConn()
		if err != nil {
			config.LogsCh <- err.Error()
			return
		}
	}

	remoteEntry, err := downloadConn.GetEntry(remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	if remoteEntry.Type == ftp.EntryTypeFolder {
		config.LogsCh <- fmt.Sprintf("\"%v\" is a folder, not a file. Cannot download. Exiting...", remoteFilePath)
	}

	remoteFile, err := downloadConn.Retr(remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

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

	//Start tracking progress and download

	trackedLFile := progress.NewWriter(localFile)
	progressCh := progress.NewTicker(context.Background(), trackedLFile, int64(remoteEntry.Size), time.Second)
	fmt.Printf("Total size: %v\n", remoteEntry.Size)

	go startTracking(remoteEntry.Name, int64(remoteEntry.Size), true, progressCh)
	func() {
		io.Copy(trackedLFile, remoteFile)

		remoteFile.Close()
		localFile.Close()
	}()
}
