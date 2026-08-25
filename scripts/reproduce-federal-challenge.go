package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

type challenge struct {
	Payload           any    `json:"payload"`
	ExpectedCanonical string `json:"expected_canonical"`
	ExpectedSHA256    string `json:"expected_sha256"`
}

func canonicalize(v any) (string, error) {
	switch x := v.(type) {
	case nil:
		return "null", nil
	case bool:
		if x {
			return "true", nil
		}
		return "false", nil
	case string:
		b, err := json.Marshal(x)
		return string(b), err
	case json.Number:
		return x.String(), nil
	case []any:
		var b bytes.Buffer
		b.WriteByte('[')
		for i, item := range x {
			if i > 0 {
				b.WriteByte(',')
			}
			s, err := canonicalize(item)
			if err != nil {
				return "", err
			}
			b.WriteString(s)
		}
		b.WriteByte(']')
		return b.String(), nil
	case map[string]any:
		keys := make([]string, 0, len(x))
		for k := range x {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		var b bytes.Buffer
		b.WriteByte('{')
		for i, k := range keys {
			if i > 0 {
				b.WriteByte(',')
			}
			kb, err := json.Marshal(k)
			if err != nil {
				return "", err
			}
			b.Write(kb)
			b.WriteByte(':')
			s, err := canonicalize(x[k])
			if err != nil {
				return "", err
			}
			b.WriteString(s)
		}
		b.WriteByte('}')
		return b.String(), nil
	default:
		return "", fmt.Errorf("unsupported JSON type %T", v)
	}
}

func main() {
	f, err := os.Open("public/challenges/federal-repro-v1.json")
	if err != nil {
		panic(err)
	}
	defer f.Close()

	dec := json.NewDecoder(f)
	dec.UseNumber()
	var c challenge
	if err := dec.Decode(&c); err != nil {
		panic(err)
	}

	canonical, err := canonicalize(c.Payload)
	if err != nil {
		panic(err)
	}
	digest := sha256.Sum256([]byte(canonical))
	actual := hex.EncodeToString(digest[:])

	fmt.Println("SignalLink Public Reproducibility Challenge #1")
	fmt.Println("Implementation: Go standard library")
	fmt.Printf("Canonical: %s\n", canonical)
	fmt.Printf("Expected:  %s\n", c.ExpectedSHA256)
	fmt.Printf("Actual:    %s\n", actual)

	if canonical != c.ExpectedCanonical || actual != c.ExpectedSHA256 {
		fmt.Println("RESULT: FAIL")
		os.Exit(1)
	}
	fmt.Println("RESULT: PASS")
}
