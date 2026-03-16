package clienthandlers

import (
	"fmt"
	"time"

	"changeme/internal/config"

	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
	"github.com/wailsapp/wails/v3/pkg/application"
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

func startTracking(name string, size int64, isDownload bool, progressCh <-chan progress.Progress) {
	app := application.Get()
	info := config.TransferInfo{
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
		app.Event.Emit("transfers:ongoing", info)
		transferMap.Store(name, info)

		fmt.Printf("Downloaded: %.2f%%\nEstimated: %v\nWritten: %v\n", p.Percent(), p.Estimated(), p.N())
		fmt.Println("--------------------------------------------------")
		fmt.Printf("\n")
	}

	info.IsComplete = true
	app.Event.Emit("transfers:completed", info)
	transferMap.Delete(name)
	config.LogsCh <- fmt.Sprintf("%v completed!", name)
}
