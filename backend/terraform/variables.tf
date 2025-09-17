variable "domain_name" {
    type = string
    default = "npcforge.micahbird.com"
}

variable "acm_cert_arn" {
    type = string
    default = "arn:aws:acm:us-east-1:381491956204:certificate/6c1ae889-d289-4ee2-9ebd-ff02d19e0af6"
}
