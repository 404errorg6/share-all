package clienthandlers

import (
	"sync"
)

var (
	verifiedUser string
	verifiedPass string
	verifiedAddr string

	transferMap sync.Map
)
