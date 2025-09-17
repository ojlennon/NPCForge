# --- START: Core Networking (VPC, IGW, Main Public Route Table) ---
resource "aws_vpc" "main" {
  cidr_block           = "172.16.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "npcforge-vpc" # This VPC will be used by all resources
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "npcforge-igw" # This IGW will be used
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "npcforge-public-rt" # This public route table will be used
  }
}
# --- END: Core Networking ---

# --- START: npcforge Instance Specific Resources ---

resource "aws_security_group" "allow_ssh" {
  name        = "allow-ssh-npcforge"
  description = "Allow SSH inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "SSH from anywhere"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"] # WARNING: For production, restrict this to your IP
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1" # Allow all outbound traffic
    cidr_blocks      = ["0.0.0.0/0"]
  }

  tags = {
    Name = "npcforge-sg-allow-ssh"
  }
}

resource "aws_subnet" "my_subnet" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.16.10.0/24"
  availability_zone = "us-east-1a" # Specify your preferred AZ

  tags = {
    Name = "npcforge-subnet"
  }
}

resource "aws_route_table_association" "subnet_assoc" {
  subnet_id      = aws_subnet.my_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_network_interface" "npcforge-net-interface" {
  subnet_id       = aws_subnet.my_subnet.id
  private_ips     = ["172.16.10.100"]
  security_groups = [aws_security_group.allow_ssh.id]

  tags = {
    Name = "npcforge-eni"
  }
}

data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# Define key pair resource
resource "aws_key_pair" "ec2-keypair" {
  key_name   = "ec2-keypair"      # Name for your key pair
  public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH0lqdgD3Ce2sXG5PsltvEOZKFE33UJAdlpibOGQKkcf npcforge-key"
}

# IAM Role for EC2 with S3 and Lambda access
resource "aws_iam_role" "npcforge_ec2_role" {
  name = "npcforge-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
      {
        "Action": "s3:*",
        "Effect": "Allow",
        "Resource": [
            "arn:aws:s3:::*",
            "arn:aws:s3:::*/*"
        ]
      },
      {
        "Action": [
            "lambda:InvokeFunction",
            "lambda:GetFunction"
        ],
        "Effect": "Allow",
        "Resource": "*"
      },
      {
        "Sid": "VisualEditor0",
        "Effect": "Allow",
        "Action": "dynamodb:*",
        "Resource": "*"
      },
      {
        "Action": [
            "dynamodb:*",
            "dax:*",
            "application-autoscaling:DeleteScalingPolicy",
            "application-autoscaling:DeregisterScalableTarget",
            "application-autoscaling:DescribeScalableTargets",
            "application-autoscaling:DescribeScalingActivities",
            "application-autoscaling:DescribeScalingPolicies",
            "application-autoscaling:PutScalingPolicy",
            "application-autoscaling:RegisterScalableTarget",
            "cloudwatch:DeleteAlarms",
            "cloudwatch:DescribeAlarmHistory",
            "cloudwatch:DescribeAlarms",
            "cloudwatch:DescribeAlarmsForMetric",
            "cloudwatch:GetMetricStatistics",
            "cloudwatch:ListMetrics",
            "cloudwatch:PutMetricAlarm",
            "cloudwatch:GetMetricData",
            "datapipeline:ActivatePipeline",
            "datapipeline:CreatePipeline",
            "datapipeline:DeletePipeline",
            "datapipeline:DescribeObjects",
            "datapipeline:DescribePipelines",
            "datapipeline:GetPipelineDefinition",
            "datapipeline:ListPipelines",
            "datapipeline:PutPipelineDefinition",
            "datapipeline:QueryObjects",
            "ec2:DescribeVpcs",
            "ec2:DescribeSubnets",
            "ec2:DescribeSecurityGroups",
            "iam:GetRole",
            "iam:ListRoles",
            "kms:DescribeKey",
            "kms:ListAliases",
            "sns:CreateTopic",
            "sns:DeleteTopic",
            "sns:ListSubscriptions",
            "sns:ListSubscriptionsByTopic",
            "sns:ListTopics",
            "sns:Subscribe",
            "sns:Unsubscribe",
            "sns:SetTopicAttributes",
            "lambda:CreateFunction",
            "lambda:ListFunctions",
            "lambda:ListEventSourceMappings",
            "lambda:CreateEventSourceMapping",
            "lambda:DeleteEventSourceMapping",
            "lambda:GetFunctionConfiguration",
            "lambda:DeleteFunction",
            "resource-groups:ListGroups",
            "resource-groups:ListGroupResources",
            "resource-groups:GetGroup",
            "resource-groups:GetGroupQuery",
            "resource-groups:DeleteGroup",
            "resource-groups:CreateGroup",
            "tag:GetResources",
            "kinesis:ListStreams",
            "kinesis:DescribeStream",
            "kinesis:DescribeStreamSummary"
        ],
        "Effect": "Allow",
        "Resource": "*"
      },
      {
        "Action": "cloudwatch:GetInsightRuleReport",
        "Effect": "Allow",
        "Resource": "arn:aws:cloudwatch:*:*:insight-rule/DynamoDBContributorInsights*"
      },
      {
        "Action": [
            "iam:PassRole"
        ],
        "Effect": "Allow",
        "Resource": "*",
        "Condition": {
            "StringLike": {
                "iam:PassedToService": [
                    "application-autoscaling.amazonaws.com",
                    "application-autoscaling.amazonaws.com.cn",
                    "dax.amazonaws.com"
                ]
            }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
            "iam:CreateServiceLinkedRole"
        ],
        "Resource": "*",
        "Condition": {
            "StringEquals": {
                "iam:AWSServiceName": [
                    "replication.dynamodb.amazonaws.com",
                    "dax.amazonaws.com",
                    "dynamodb.application-autoscaling.amazonaws.com",
                    "contributorinsights.dynamodb.amazonaws.com",
                    "kinesisreplication.dynamodb.amazonaws.com"
                ]
            }
        }
      }
    ]
  })
  
  tags = {
    Name = "npcforge-ec2-role"
  }
}

# Policy for S3 access
resource "aws_iam_policy" "npcforge_s3_policy" {
  name        = "npcforge-s3-access"
  description = "Allow access to the images S3 bucket"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::images",
          "arn:aws:s3:::images/*"
        ]
      }
    ]
  })
}

# Policy for Lambda invocation
resource "aws_iam_policy" "npcforge_lambda_policy" {
  name        = "npcforge-lambda-access"
  description = "Allow invoking Lambda functions"
  
  policy = jsonencode({
    "Version": "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ],
  })
}

# Attach S3 policy to role
resource "aws_iam_role_policy_attachment" "npcforge_s3_attach" {
  role       = aws_iam_role.npcforge_ec2_role.name
  policy_arn = aws_iam_policy.npcforge_s3_policy.arn
}

# Attach Lambda policy to role
resource "aws_iam_role_policy_attachment" "npcforge_lambda_attach" {
  role       = aws_iam_role.npcforge_ec2_role.name
  policy_arn = aws_iam_policy.npcforge_lambda_policy.arn
}

# Create instance profile
resource "aws_iam_instance_profile" "npcforge_instance_profile" {
  name = "npcforge-instance-profile"
  role = aws_iam_role.npcforge_ec2_role.name
}

# Updated EC2 instance with instance profile
resource "aws_instance" "npcforge-server" {
  ami           = data.aws_ssm_parameter.amazon_linux_2023.value
  key_name      = aws_key_pair.ec2-keypair.key_name
  instance_type = "t2.micro"
  iam_instance_profile = aws_iam_instance_profile.npcforge_instance_profile.name
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install tmux htop nodejs nginx amazon-cloudwatch-agent -y
              mkdir -p /home/ec2-user/frontend
              chown -R 1000:1000 /home/ec2-user/frontend
              sudo setcap cap_net_bind_service=+ep `readlink -f \\`which node\\``
              EOF
  network_interface {
    network_interface_id = aws_network_interface.npcforge-net-interface.id
    device_index         = 0
  }
  tags = {
    Name = "npcforge"
  }
}

resource "aws_eip" "npcforge-eip" {
  instance   = aws_instance.npcforge-server.id
  domain     = "vpc"
  depends_on = [aws_internet_gateway.gw] # Ensures IGW is created before EIP logic
}
# --- END: npcforge Instance Specific Resources ---

# --- START: DynamoDB --- 

# Player Table
resource "aws_dynamodb_table" "player_table" {
  name           = "NPCForge_Player"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "Id"
  
  attribute {
    name = "Id"
    type = "S"
  }
  
  attribute {
    name = "GamerTag"
    type = "S"
  }
  
  global_secondary_index {
    name               = "GamerTagIndex"
    hash_key           = "GamerTag"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  # Other fields to be stored (not part of key or index):
  # - GamerTag (Text)
  
  tags = {
    Name = "npcforge-player"
  }
}

# Game Table
resource "aws_dynamodb_table" "game_table" {
  name           = "NPCForge_Game"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "Id"
  
  attribute {
    name = "Id"
    type = "S"
  }
  
  attribute {
    name = "Name"
    type = "S"
  }
  
  global_secondary_index {
    name               = "GameNameIndex"
    hash_key           = "Name"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  # Other fields to be stored (not part of key or index):
  # - Name (Text)
  # - Description (Text)
  # - ImagePath (Text)
  
  tags = {
    Name = "npcforge-game"
  }
}

# NPC Table
resource "aws_dynamodb_table" "npc_table" {
  name           = "NPCForge_NPC"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "Id"
  range_key      = "GameId"  # Foreign key to Game table
  
  attribute {
    name = "Id"
    type = "S"
  }
  
  attribute {
    name = "GameId"
    type = "S"
  }
  
  attribute {
    name = "Name"
    type = "S"
  }
  
  global_secondary_index {
    name               = "GameIdIndex"
    hash_key           = "GameId"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  global_secondary_index {
    name               = "NPCNameIndex"
    hash_key           = "Name"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  # Other fields to be stored (not part of key or index):
  # - Description (Text)  
  # - Backstory (Text)
  # - ExampleSpeech (Text)
  # - Gender (Text)
  # - Accent (Text)
  # - Information (Map/Object)
  # - ApiEndpoint (Text)
  # - ImagePath (Text)
  # - Goals (Map) - Sequential goals for player to complete, with numerical string keys
  
  tags = {
    Name = "npcforge-npc"
  }
}

# Interaction Table
resource "aws_dynamodb_table" "interaction_table" {
  name           = "NPCForge_Interaction"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "Id"
  range_key      = "InteractionTime"
  
  attribute {
    name = "Id"
    type = "S"
  }
  
  attribute {
    name = "PlayerId"
    type = "S"
  }
  
  attribute {
    name = "NPCId"
    type = "S"
  }
  
  attribute {
    name = "GameId"
    type = "S"
  }
  
  attribute {
    name = "InteractionTime"
    type = "S"  # Using string format for timestamp for better flexibility
  }
  
  global_secondary_index {
    name               = "PlayerIdIndex"
    hash_key           = "PlayerId"
    range_key          = "InteractionTime"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  global_secondary_index {
    name               = "NPCIdIndex"
    hash_key           = "NPCId"
    range_key          = "InteractionTime"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  global_secondary_index {
    name               = "GameIdIndex"
    hash_key           = "GameId"
    range_key          = "InteractionTime"
    projection_type    = "ALL"
    write_capacity     = 5
    read_capacity      = 5
  }
  
  # Other fields to be stored (not part of key or index):
  # - Summary (Text)
  
  tags = {
    Name = "npcforge-interaction"
  }
}

# --- END: DynamoDB ---

# --- END: Swarm Cluster Resources ---

# --- START: S3 ---
resource "aws_s3_bucket" "images-bucket" {
  bucket = "npcforge-images"
}
# --- END: S3 ---

# --- START: AWS Lambda---
# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "lambda-gaming-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda Functions
resource "aws_iam_policy" "lambda_gaming_policy" {
  name        = "LambdaGamingPolicy"
  description = "IAM policy for all gaming Lambda functions"
 
  policy = jsonencode({
    "Version": "2012-10-17"
    "Statement": [
      {
          "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
          ],
          "Effect": "Allow",
          "Resource": "arn:aws:logs:*:*:*"
      },
      {
          "Action": [
              "transcribe:StartTranscriptionJob",
              "transcribe:GetTranscriptionJob"
          ],
          "Effect": "Allow",
          "Resource": "*"
      },
      {
          "Action": [
              "bedrock:InvokeModel"
          ],
          "Effect": "Allow",
          "Resource": [
              "arn:aws:bedrock:*::foundation-model/amazon.nova-micro-v1:0"
          ]
      },
      {
          "Action": [
              "dynamodb:PutItem",
              "dynamodb:Scan",
              "dynamodb:Query"
          ],
          "Effect": "Allow",
          "Resource": [
              "arn:aws:dynamodb:*:*:table/NPC",
              "arn:aws:dynamodb:*:*:table/Game",
              "arn:aws:dynamodb:*:*:table/Player",
              "arn:aws:dynamodb:*:*:table/Interaction",
              "arn:aws:dynamodb:*:*:table/Interaction/index/*"
          ]
      },
      {
          "Action": [
              "s3:GetObject"
          ],
          "Effect": "Allow",
          "Resource": [
              "arn:aws:s3:::*transcription*/*",
              "arn:aws:s3:::*audio*/*"
          ]
      },
      {
          "Action": [
            "s3:*"
          ],
          "Effect": "Allow",
          "Resource": [
            "arn:aws:s3:::*",
            "arn:aws:s3:::*/*"
          ]
      },
      {
          "Action": [
            "dynamodb:*"
          ],
          "Effect": "Allow",
          "Resource": [
            "arn:aws:dynamodb:*:*:table/*",
            "arn:aws:dynamodb:*:*:table/*/index/*"
          ]
      },
      {
        "Action": [
          "bedrock:*"
        ],
        "Effect": "Allow",
        "Resource": "*"
      },
      {
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Effect": "Allow",
        "Resource": "arn:aws:logs:*:*:*"
      }
    ],
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "lambda_gaming_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_gaming_policy.arn
}

# Lambda Functions using the shared role
resource "aws_lambda_function" "process_transcription" {
  filename         = "../Lambda_Files/process_transcription.js.zip"
  function_name    = "processTranscription"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.processTranscription"
  runtime          = "nodejs18.x"
  timeout          = 300 # 5 minutes for transcription processing

  # It's a good practice to include a source_code_hash to trigger updates
  # when the js.zip file changes. You can generate this with the filemd5() function.
  source_code_hash = filemd5("../Lambda_Files/process_transcription.js.zip")
}

resource "aws_lambda_function" "fetch_history" {
  filename         = "../Lambda_Files/fetch_history.js.zip"
  function_name    = "fetchHistory"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.fetchHistory"
  runtime          = "nodejs18.x"
  timeout          = 60

  source_code_hash = filemd5("../Lambda_Files/fetch_history.js.zip")
}

resource "aws_lambda_function" "save_npc" {
  filename         = "../Lambda_Files/save_npc.js.zip"
  function_name    = "saveNPC"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.saveNPC"
  runtime          = "nodejs18.x"
  timeout          = 30

  source_code_hash = filemd5("../Lambda_Files/save_npc.js.zip")
}

resource "aws_lambda_function" "save_game" {
  filename         = "../Lambda_Files/save_game.js.zip"
  function_name    = "saveGame"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.saveGame"
  runtime          = "nodejs18.x"
  timeout          = 30

  source_code_hash = filemd5("../Lambda_Files/save_game.js.zip")
}
# # --- END: Lambda Resources ---

# --- START: ALB Resources ---

# Security group for the Application Load Balancer
# Allows inbound web traffic from the internet.
resource "aws_security_group" "lb_sg" {
  name        = "alb-public-sg"
  description = "Allow HTTP and HTTPS traffic to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ALB Security Group"
  }
}

# Create additional subnet just for ALB to work
resource "aws_subnet" "my_subnet_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.16.11.0/24" # A new, non-overlapping CIDR block is required
  availability_zone = "us-east-1b"

  tags = {
    Name = "npcforge-subnet-b"
  }
}


# Create the Application Load Balancer
resource "aws_lb" "main" {
  name               = "my-app-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets = [ aws_subnet.my_subnet.id, aws_subnet.my_subnet_b.id ]

  tags = {
    Name = "Main App LB"
  }
}

# Create a Target Group for the EC2 instance
resource "aws_lb_target_group" "app" {
  name     = "my-app-tg"
  port     = 80 # The port your application on the EC2 instance listens on
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# Attach the EC2 instance to the Target Group
resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.npcforge-server.id
  port             = 80 # The port the instance is being targeted on
}

# LISTENER 1: HTTP on Port 80
# This listener redirects all traffic to HTTPS
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # The default action is to issue a 301 redirect
  default_action {
    type = "redirect"

    redirect {
      protocol    = "HTTPS"
      port        = "443"
      status_code = "HTTP_301"
    }
  }
}

# LISTENER 2: HTTPS on Port 443
# This listener handles secure traffic and forwards it to the target group
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08" # A strong, default SSL policy
  certificate_arn   = var.acm_cert_arn

  # The default action is to forward traffic to our app's target group
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}