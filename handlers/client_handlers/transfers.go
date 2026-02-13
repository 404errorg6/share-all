package clienthandlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
)

type ProgressInfo struct {
	Name                   string
	TotalSize              int64
	Percent                float64
	Written                int64
	EstimatedRemainingTime string
}

var (
	transferMap = make(map[string]ProgressInfo)
	free        = make(chan bool, config.DownloadLimit)
)

func init() {
	for range config.DownloadLimit {
		free <- true
	}
}

func HandleTransfer(w http.ResponseWriter, req *http.Request) {
	var transfersArr []ProgressInfo
	for _, info := range transferMap {
		transfersArr = append(transfersArr, info)
	}

	config.SendJSON(w, transfersArr)
}

func WriteWithProgressBar(name string, dest *os.File, src *ftp.Response, size int64, wait chan bool) {
	<-free
	defer func() { free <- true }()

	defer dest.Close()
	defer src.Close()

	wait <- false

	fmt.Println("Entered progress function")
	destNew := progress.NewWriter(dest)
	progressCh := progress.NewTicker(context.Background(), destNew, size, time.Second)
	fmt.Printf("Total size: %v\n", size)

	go func() {
		info := ProgressInfo{
			TotalSize: size,
			Name:      name,
		}

		for p := range progressCh {
			info.Percent = p.Percent()
			info.Written = p.N()
			info.EstimatedRemainingTime = p.Remaining().String()
			transferMap[name] = info

			fmt.Printf("Downloaded: %.2f%%\nRemaining: %v\nEstimated: %v\nWritten: %v\n", p.Percent(), getRemaining(p), p.Estimated(), p.N())
			fmt.Println("--------------------------------------------------")
			fmt.Printf("\n")
		}

		delete(transferMap, name)
		fmt.Println("Completed!")
	}()

	io.Copy(destNew, src)

}

// TODO: Reinvented the wheel?
func getRemaining(p progress.Progress) string {
	d := p.Remaining()
	if d <= 0 {
		return "Calculating..."
	}

	remainingSeconds := int64(d.Seconds())
	var remaining string
	hours := remainingSeconds / 3600
	minutes := (remainingSeconds % 3600) / 60
	seconds := remainingSeconds % 60

	if hours >= 1 {
		remaining = fmt.Sprintf("%vh%vm%vs", hours, minutes, seconds)
		return remaining
	}

	if hours >= 1 {
		remaining = fmt.Sprintf("%vm%vs", minutes, seconds)
		return remaining
	}

	remaining = fmt.Sprintf("%vs", seconds)
	return remaining
}

func getLength(r io.Reader) int64 {
	if seeker, ok := r.(io.Seeker); ok {
		fmt.Println("Seek successfull")
		size, _ := seeker.Seek(0, io.SeekEnd)
		seeker.Seek(0, io.SeekStart)
		return size
	}

	size, _ := io.Copy(io.Discard, r)
	return size
}
