package sms

import (
	"fmt"
	"log"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	dysmsapi "github.com/alibabacloud-go/dysmsapi-20170525/v4/client"
	"github.com/alibabacloud-go/tea/tea"
)

type Config struct {
	AccessKeyID     string
	AccessKeySecret string
	SignName        string
	TemplateCode    string
}

var client *dysmsapi.Client
var cfg Config

func Init(c Config) {
	cfg = c
	apiConfig := &openapi.Config{
		AccessKeyId:     tea.String(c.AccessKeyID),
		AccessKeySecret: tea.String(c.AccessKeySecret),
		Endpoint:        tea.String("dysmsapi.aliyuncs.com"),
	}
	var err error
	client, err = dysmsapi.NewClient(apiConfig)
	if err != nil {
		log.Fatalf("failed to init aliyun sms client: %v", err)
	}
	log.Println("aliyun sms client initialized")
}

func SendCode(phone, code string) error {
	if client == nil {
		return fmt.Errorf("sms client not initialized")
	}

	req := &dysmsapi.SendSmsRequest{
		PhoneNumbers:  tea.String(phone),
		SignName:      tea.String(cfg.SignName),
		TemplateCode:  tea.String(cfg.TemplateCode),
		TemplateParam: tea.String(fmt.Sprintf(`{"code":"%s"}`, code)),
	}

	resp, err := client.SendSms(req)
	if err != nil {
		return fmt.Errorf("send sms failed: %w", err)
	}

	if resp.Body != nil && resp.Body.Code != nil && *resp.Body.Code != "OK" {
		return fmt.Errorf("sms error: %s - %s", tea.StringValue(resp.Body.Code), tea.StringValue(resp.Body.Message))
	}

	return nil
}
