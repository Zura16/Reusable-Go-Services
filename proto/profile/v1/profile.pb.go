// Package profilev1 defines the ProfileService gRPC message types.
//
// This package provides the message types for the ProfileService gRPC service,
// which allows looking up user profiles by their unique identifier.
//
// These types implement manual protobuf wire-format marshaling so they work
// with gRPC without requiring protoc code generation. For production use,
// regenerate from profile.proto:
//
//	make generate
package profilev1

import (
	"encoding/binary"
	"fmt"
	"io"
	"math"
)

// GetProfileRequest is the request message for the GetProfile RPC.
type GetProfileRequest struct {
	// UserId is the unique identifier of the user whose profile is being requested.
	UserId string `json:"user_id,omitempty"`
}

func (x *GetProfileRequest) Reset()         { *x = GetProfileRequest{} }
func (x *GetProfileRequest) String() string  { return fmt.Sprintf("GetProfileRequest{UserId:%q}", x.GetUserId()) }
func (*GetProfileRequest) ProtoMessage()     {}

// Marshal implements the proto.Marshaler interface.
func (x *GetProfileRequest) Marshal() ([]byte, error) {
	if x == nil {
		return nil, nil
	}
	var buf []byte
	if len(x.UserId) > 0 {
		buf = appendString(buf, 1, x.UserId)
	}
	return buf, nil
}

// Unmarshal implements the proto.Unmarshaler interface.
func (x *GetProfileRequest) Unmarshal(data []byte) error {
	for len(data) > 0 {
		fieldNum, wireType, n, err := decodeTag(data)
		if err != nil {
			return err
		}
		data = data[n:]

		switch fieldNum {
		case 1: // user_id
			if wireType != 2 {
				return fmt.Errorf("unexpected wire type %d for field user_id", wireType)
			}
			s, n, err := decodeString(data)
			if err != nil {
				return err
			}
			x.UserId = s
			data = data[n:]
		default:
			n, err := skipField(data, wireType)
			if err != nil {
				return err
			}
			data = data[n:]
		}
	}
	return nil
}

// MarshalTo implements marshaling into a pre-allocated buffer.
func (x *GetProfileRequest) MarshalTo(data []byte) (int, error) {
	b, err := x.Marshal()
	if err != nil {
		return 0, err
	}
	return copy(data, b), nil
}

// Size returns the serialized size of the message.
func (x *GetProfileRequest) Size() int {
	if x == nil {
		return 0
	}
	n := 0
	if len(x.UserId) > 0 {
		n += 1 + sovLen(len(x.UserId)) + len(x.UserId)
	}
	return n
}

func (x *GetProfileRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

// GetProfileResponse is the response message for the GetProfile RPC.
type GetProfileResponse struct {
	// UserId is the unique identifier of the user.
	UserId string `json:"user_id,omitempty"`
	// DisplayName is the user's chosen display name.
	DisplayName string `json:"display_name,omitempty"`
	// Email is the user's email address.
	Email string `json:"email,omitempty"`
}

func (x *GetProfileResponse) Reset()         { *x = GetProfileResponse{} }
func (x *GetProfileResponse) String() string {
	return fmt.Sprintf("GetProfileResponse{UserId:%q, DisplayName:%q, Email:%q}",
		x.GetUserId(), x.GetDisplayName(), x.GetEmail())
}
func (*GetProfileResponse) ProtoMessage() {}

// Marshal implements the proto.Marshaler interface.
func (x *GetProfileResponse) Marshal() ([]byte, error) {
	if x == nil {
		return nil, nil
	}
	var buf []byte
	if len(x.UserId) > 0 {
		buf = appendString(buf, 1, x.UserId)
	}
	if len(x.DisplayName) > 0 {
		buf = appendString(buf, 2, x.DisplayName)
	}
	if len(x.Email) > 0 {
		buf = appendString(buf, 3, x.Email)
	}
	return buf, nil
}

// Unmarshal implements the proto.Unmarshaler interface.
func (x *GetProfileResponse) Unmarshal(data []byte) error {
	for len(data) > 0 {
		fieldNum, wireType, n, err := decodeTag(data)
		if err != nil {
			return err
		}
		data = data[n:]

		switch fieldNum {
		case 1: // user_id
			if wireType != 2 {
				return fmt.Errorf("unexpected wire type %d for field user_id", wireType)
			}
			s, n, err := decodeString(data)
			if err != nil {
				return err
			}
			x.UserId = s
			data = data[n:]
		case 2: // display_name
			if wireType != 2 {
				return fmt.Errorf("unexpected wire type %d for field display_name", wireType)
			}
			s, n, err := decodeString(data)
			if err != nil {
				return err
			}
			x.DisplayName = s
			data = data[n:]
		case 3: // email
			if wireType != 2 {
				return fmt.Errorf("unexpected wire type %d for field email", wireType)
			}
			s, n, err := decodeString(data)
			if err != nil {
				return err
			}
			x.Email = s
			data = data[n:]
		default:
			n, err := skipField(data, wireType)
			if err != nil {
				return err
			}
			data = data[n:]
		}
	}
	return nil
}

// MarshalTo implements marshaling into a pre-allocated buffer.
func (x *GetProfileResponse) MarshalTo(data []byte) (int, error) {
	b, err := x.Marshal()
	if err != nil {
		return 0, err
	}
	return copy(data, b), nil
}

// Size returns the serialized size of the message.
func (x *GetProfileResponse) Size() int {
	if x == nil {
		return 0
	}
	n := 0
	if len(x.UserId) > 0 {
		n += 1 + sovLen(len(x.UserId)) + len(x.UserId)
	}
	if len(x.DisplayName) > 0 {
		n += 1 + sovLen(len(x.DisplayName)) + len(x.DisplayName)
	}
	if len(x.Email) > 0 {
		n += 1 + sovLen(len(x.Email)) + len(x.Email)
	}
	return n
}

func (x *GetProfileResponse) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

func (x *GetProfileResponse) GetDisplayName() string {
	if x != nil {
		return x.DisplayName
	}
	return ""
}

func (x *GetProfileResponse) GetEmail() string {
	if x != nil {
		return x.Email
	}
	return ""
}

// ---------------------------------------------------------------------------
// Protobuf wire format helpers
// ---------------------------------------------------------------------------

// appendString appends a length-delimited string field to buf.
func appendString(buf []byte, fieldNum int, s string) []byte {
	// Tag: (fieldNum << 3) | 2 (wire type 2 = length-delimited)
	buf = appendVarint(buf, uint64(fieldNum<<3|2))
	buf = appendVarint(buf, uint64(len(s)))
	buf = append(buf, s...)
	return buf
}

// appendVarint appends a varint-encoded uint64 to buf.
func appendVarint(buf []byte, v uint64) []byte {
	for v >= 0x80 {
		buf = append(buf, byte(v)|0x80)
		v >>= 7
	}
	buf = append(buf, byte(v))
	return buf
}

// decodeTag decodes a protobuf tag from data, returning fieldNum, wireType,
// and the number of bytes consumed.
func decodeTag(data []byte) (fieldNum int, wireType int, n int, err error) {
	v, n, err := decodeVarint(data)
	if err != nil {
		return 0, 0, 0, err
	}
	return int(v >> 3), int(v & 0x7), n, nil
}

// decodeVarint decodes a varint from data.
func decodeVarint(data []byte) (uint64, int, error) {
	var v uint64
	for i := 0; i < len(data) && i < binary.MaxVarintLen64; i++ {
		b := data[i]
		v |= uint64(b&0x7f) << (7 * i)
		if b < 0x80 {
			return v, i + 1, nil
		}
	}
	return 0, 0, io.ErrUnexpectedEOF
}

// decodeString decodes a length-delimited string from data.
func decodeString(data []byte) (string, int, error) {
	length, n, err := decodeVarint(data)
	if err != nil {
		return "", 0, err
	}
	if uint64(len(data)-n) < length {
		return "", 0, io.ErrUnexpectedEOF
	}
	return string(data[n : n+int(length)]), n + int(length), nil
}

// skipField skips a field of the given wire type.
func skipField(data []byte, wireType int) (int, error) {
	switch wireType {
	case 0: // varint
		_, n, err := decodeVarint(data)
		return n, err
	case 1: // 64-bit
		if len(data) < 8 {
			return 0, io.ErrUnexpectedEOF
		}
		return 8, nil
	case 2: // length-delimited
		length, n, err := decodeVarint(data)
		if err != nil {
			return 0, err
		}
		return n + int(length), nil
	case 5: // 32-bit
		if len(data) < 4 {
			return 0, io.ErrUnexpectedEOF
		}
		return 4, nil
	default:
		return 0, fmt.Errorf("unknown wire type %d", wireType)
	}
}

// sovLen returns the encoded length of a varint.
func sovLen(x int) int {
	if x == 0 {
		return 1
	}
	return int(math.Ceil(float64(bitsLen(uint64(x))) / 7.0))
}

func bitsLen(x uint64) int {
	n := 0
	for x > 0 {
		n++
		x >>= 1
	}
	return n
}
