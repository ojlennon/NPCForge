output "npcforge_instance_ssh_command" {
  description = "SSH command to connect to the npcforge instance (replace ubuntu with actual user if different, e.g. ec2-user for Amazon Linux)"
  value       = "ssh -i ec2-keypair.pem ec2-user@${aws_eip.npcforge-eip.public_ip}"
  # Assuming key_name "bench" means "bench.pem". Adjust if your AMI user is different.
}

output "lb_dns_name" {
  description = "The DNS name of the Application Load Balancer."
  value       = aws_lb.main.dns_name
}