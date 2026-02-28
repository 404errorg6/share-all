package clienthandlers

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/machinebox/progress"
)

type ProgressInfo struct {
	Name      string
	TotalSize int64
	Percent   float64
	Written   int64
}

var (
	transferMap  = make(map[string]ProgressInfo)
	downloadPass = make(chan bool, config.DownloadLimit)
)

func init() { //Initialze
	for range config.DownloadLimit {
		downloadPass <- true
	}
}

func DownloadWithProgressBar(localFilePath, remoteFilePath string, wait chan bool) { //Simply runs downloads
	<-downloadPass
	defer func() { downloadPass <- true }()

	//Make new connection for each download
	c, err := GetNewConn()
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}
	defer c.Logout()

	err = areFiles("", remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
	}

	remoteEntry, err := c.GetEntry(remoteFilePath)
	if err != nil {
		config.LogsCh <- err.Error()
		return
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

	fmt.Printf("Reached first end\n\n")
	wait <- false
	fmt.Printf("Starrt of transfer\n\n")

	fmt.Println("Entered progress function")
	trackedLFile := progress.NewWriter(localFile)
	progressCh := progress.NewTicker(context.Background(), trackedLFile, int64(remoteEntry.Size), time.Second)
	fmt.Printf("Total size: %v\n", remoteEntry.Size)

	go func() {
		name := remoteEntry.Name
		info := ProgressInfo{
			TotalSize: int64(remoteEntry.Size),
			Name:      name,
		}

		for p := range progressCh {
			info.Percent = p.Percent()
			info.Written = p.N()
			transferMap[name] = info

			fmt.Printf("Downloaded: %.2f%%\nEstimated: %v\nWritten: %v\n", p.Percent(), p.Estimated(), p.N())
			fmt.Println("--------------------------------------------------")
			fmt.Printf("\n")
		}

		delete(transferMap, name)
		fmt.Println("Completed!")
	}()

	io.Copy(trackedLFile, remoteFile)
}
