package clienthandlers

import "github.com/404errorg6/FTP-server/ftp/config"

type ProgressInfo struct {
	Name       string
	TotalSize  int64
	Percent    float64
	Written    int64
	IsDownload bool
}

var (
	verifiedUser string
	verifiedPass string
	verifiedAddr string
	transferMap  = make(map[string]ProgressInfo)
	downloadPass = make(chan bool, config.DownloadLimit)
	uploadPass   = make(chan bool, config.UploadLimit)
)
