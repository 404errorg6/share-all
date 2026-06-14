package p2phandlers

import (
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/404errorg6/share-all/internal/p2p"
)

func HandlePendingInvite(w http.ResponseWriter, req *http.Request) {
	config.SendJSON(w, map[string]string{
		"invite": p2p.ConsumePendingInvite(),
	})
}
