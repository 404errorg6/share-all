package p2p

import (
	"strings"
	"sync"

	"github.com/404errorg6/share-all/internal/config"
)

var (
	pendingInviteMu  sync.Mutex
	pendingInviteURL string
)

func Init() {
	if err := registerProtocol(); err != nil {
		config.LogsCh <- "P2P protocol registration skipped: " + err.Error()
	}
}

func CaptureInviteArg(args []string) {
	for _, arg := range args {
		if looksLikeInviteURL(arg) {
			SetPendingInvite(arg)
			return
		}
	}
}

func looksLikeInviteURL(value string) bool {
	lower := strings.ToLower(strings.TrimSpace(value))
	return strings.HasPrefix(lower, "shareall://join?")
}

func SetPendingInvite(invite string) {
	pendingInviteMu.Lock()
	defer pendingInviteMu.Unlock()
	pendingInviteURL = strings.TrimSpace(invite)
}

func ConsumePendingInvite() string {
	pendingInviteMu.Lock()
	defer pendingInviteMu.Unlock()
	invite := pendingInviteURL
	pendingInviteURL = ""
	return invite
}
