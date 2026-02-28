package clienthandlers

import (
	"fmt"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
)

// Initialize downloadPass
func init() {
	for range config.DownloadLimit {
		downloadPass <- true
	}
}

// Initialize uploadPass
func init() {
	for range config.UploadLimit {
		uploadPass <- true
	}
}

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

func startTracking(name string, size int64, isDownload bool, progressCh <-chan progress.Progress) {
	info := TransferInfo{
		TotalSize:  size,
		Name:       name,
		IsDownload: isDownload,
	}

	if isDownload {
		config.LogsCh <- fmt.Sprintf("Downloading %v...", name)
	} else {
		config.LogsCh <- fmt.Sprintf("Uploading %v...", name)
	}

	for p := range progressCh {
		info.Percent = p.Percent()
		info.Written = p.N()
		transferMap.Store(name, info)

		fmt.Printf("Downloaded: %.2f%%\nEstimated: %v\nWritten: %v\n", p.Percent(), p.Estimated(), p.N())
		fmt.Println("--------------------------------------------------")
		fmt.Printf("\n")
	}

	transferMap.Delete(name)
	config.LogsCh <- fmt.Sprintf("%v completed!", name)
	fmt.Println("Completed!")
}
