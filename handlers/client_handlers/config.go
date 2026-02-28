package clienthandlers

import (
	"sync"

	"github.com/404errorg6/FTP-server/ftp/config"
)

type TransferInfo struct {
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

	transferMap  sync.Map
	downloadPass = make(chan bool, config.DownloadLimit)
	uploadPass   = make(chan bool, config.UploadLimit)
)
