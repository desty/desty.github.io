---
title: "Lessons from OpenAI's Real-Time Voice AI Infrastructure"
summary: "Analyzing how OpenAI redesigned WebRTC to deliver low-latency voice AI to 900M+ users, and practical insights for developers building similar systems."
date: "2026-05-05T18:00:00"
tags:
  - webrtc
  - voice-ai
  - infrastructure
  - real-time
  - openai
---

OpenAI recently published [Delivering Low-Latency Voice AI at Scale](https://openai.com/index/delivering-low-latency-voice-ai-at-scale/), detailing how they designed their WebRTC infrastructure to serve real-time voice conversations to over 900 million weekly active users. What makes it worth reading is that it goes beyond a typical engineering blog — it honestly explains **why** they made each architectural choice.

If you're building or considering a real-time voice system, there's a lot to take away.

---

## Core Architecture: Relay + Transceiver Instead of SFU

When building a WebRTC-based media server, the default choice is usually an SFU (Selective Forwarding Unit) — a structure optimized for multi-party calls like video conferencing.

OpenAI didn't use one. The reason is simple — **voice AI is a 1:1 session**.

```
[User] ←→ [Global Relay] ←→ [Transceiver] ←→ [AI Model]
```

- **Transceiver**: Dedicated to 1:1 sessions. Acts as the WebRTC endpoint and communicates directly with the AI model.
- **Global Relay**: A lightweight packet forwarder distributed globally. It doesn't interpret protocols — just forwards packets.

They stripped away SFU's multi-party routing complexity and chose a simpler structure that fits 1:1 sessions.

### Developer Insight

> **Pick the right tool for the problem.** Choosing an SFU because it's "industry standard" saddles you with unnecessary complexity for 1:1 voice scenarios. Simple session structure deserves simple infrastructure.

---

## Embedding Routing Info in ICE ufrag

They embedded routing metadata in the `ufrag` (username fragment) used by ICE (Interactive Connectivity Establishment) during WebRTC connection setup. Why is this clever?

- Routing information is already in the **very first packet** the client sends.
- The Global Relay can forward packets to the correct Transceiver without querying a separate signaling server.
- Reduces round-trips (RTT) during connection establishment.

### Developer Insight

> **Use the margins of existing protocols.** Instead of creating a new protocol or adding a separate channel, they piggybacked on an existing field. A clean example of optimizing routing without breaking WebRTC standards.

---

## The UDP Port Problem on Kubernetes

Traditional WebRTC servers expose one UDP port per session. Fine on bare metal, but a headache on Kubernetes:

- `hostPort` mappings limit ports per node.
- Widening port ranges expands the security surface.
- Managing thousands of concurrent sessions makes port allocation an operational burden.

OpenAI's solution: **Global Relay exposes only a few public ports and routes internally using ufrag-based routing** to the correct Transceiver.

### Developer Insight

> **Infrastructure environment can dictate architecture.** A "theoretically correct" design that can't operate on Kubernetes is meaningless. When running UDP-based protocols on K8s, design your port strategy from day one. Retrofitting is expensive.

---

## Lightweight Relay Written in Go

The Global Relay is written in Go, and its key characteristic is that **it does not terminate protocols**.

- It doesn't interpret DTLS/SRTP. It forwards packets without inspecting them.
- This allows a single relay to handle tens of thousands of sessions.
- CPU load from encryption is concentrated on the Transceiver, while the Relay focuses purely on network I/O.

In the Go ecosystem, [Pion](https://github.com/pion/webrtc) is the de facto standard WebRTC library, and OpenAI appears to have leveraged it. The Pion developer himself welcomed the public disclosure of this use case.

### Developer Insight

> **Separate roles and minimize each component's responsibilities.** Relay handles routing only; Transceiver handles media processing only. This separation enables cheap global relay deployment and independent scaling.

The Go + Pion combination is a proven choice for building real-time media servers. The learning curve is manageable, and production references are now plentiful.

---

## What Matters More Than Latency: Turn Management

Beyond the scope of OpenAI's article, community feedback surfaced an issue that real voice AI users actually experience — and it's not network latency.

**"The AI starts talking before I've finished thinking."**

- Faster responses seem better in theory, but users perceive it as **"an AI that interrupts me."**
- The irony of users inserting fillers like "um...", "well..." to buy thinking time.
- This happens because VAD (Voice Activity Detection) uses simple silence detection to hand off turns.

An open-source project called [Pipecat](https://github.com/pipecat-ai/pipecat) tackles this problem. It offers a Smart Turn VAD model that attempts to judge **utterance completion intent** rather than just detecting silence.

### Developer Insight

> **Reducing network latency is necessary but not sufficient.** Voice AI UX is ultimately determined by turn management. If you build all the infrastructure first and then discover "wait, the conversation feels unnatural" — it's too late. Turn management strategy should be developed alongside infrastructure design.

---

## Practical Checklist

Questions to answer when building voice AI or real-time media systems:

| Question | OpenAI's Choice |
|----------|----------------|
| Is the session 1:1 or N:N? | 1:1 → Transceiver instead of SFU |
| Need a separate service for packet routing? | Metadata embedded in ICE ufrag |
| How to manage UDP on K8s? | Relay exposes few ports, internal routing |
| Can media processing and packet forwarding be separated? | Relay (forwarding only) + Transceiver (processing) |
| How to recover sessions on failure? | (Not disclosed — design it yourself) |
| At which layer should turn management happen? | (Not covered in the infra article) |

The last two items are blank. They're the parts OpenAI didn't disclose, and also the parts you'll spend the most time thinking about when you actually build one.

---

## References

- [OpenAI: Delivering Low-Latency Voice AI at Scale](https://openai.com/index/delivering-low-latency-voice-ai-at-scale/)
- [Pion WebRTC (Go)](https://github.com/pion/webrtc) — Go-based WebRTC library
- [WebRTC for the Curious](https://webrtcforthecurious.com/) — WebRTC learning resource by the Pion team
- [Pipecat](https://github.com/pipecat-ai/pipecat) — Voice AI pipeline framework with Smart Turn VAD
- [GeekNews Discussion](https://news.hada.io/topic?id=29168) — Korean community reactions and insights
