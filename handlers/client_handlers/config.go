package clienthandlers

import (
	"sync"
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

	transferMap sync.Map
)
