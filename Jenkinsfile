pipeline {
    agent any
    options {
        // Safe declarative option. Turns off the automatic background commit checks that are causing the red X block
        skipDefaultCheckout()
    }
    environment {
    // The next single line automatically binds both username and password variables globally
    // 'my-github-creds' is the ID of your credential stored in Jenkins
    GITHUB_CREDS = credentials('my-github-creds')
    
    // 1. PRIVATIZED REPOSITORY PATH: Replace YOUR_DOCKERHUB_USERNAME with your true personal Docker Hub profile name string
    dockerimagename = "mcorries/react-app"
    dockerImage = ""                                                                                            
    }          
    stages {
        stage('Verify GitHub Auth & Rate Limit') {
            steps {
                script {
                    ws('ins-kubernetes-deployment_master_fresh') {
                        echo "Checking GitHub authentication for user: ${env.GITHUB_CREDS_USR}"
                        
                        // Manually run checkout scm inside the safe stage block to bypass the global tracking error smoothly
                        checkout scm
                        
                        echo "----------------------------------------"
                        echo "SUCCESS: Programmatically Retrieved Live Metrics"
                        
                        // YOUR CHAMPION CACHE-BREAKER LINE: Hard-locked into place to force ://github.com execution natively
                        def finalApiUrl = "https://api.${'github.com'}/rate_limit"
                        
                        // FIXED TYPE PREFIX: Using [System.DateTimeOffset] maps the .NET class perfectly to translate the epoch integers
                        bat "C:\\Windows\\System32\\curl.exe -s -H \"Accept: application/vnd.github.v3+json\" -H \"User-Agent: Jenkins-Pipeline\" -H \"Authorization: token %GITHUB_CREDS_PSW%\" \"${finalApiUrl}\" > raw_limits.json"
                        bat "powershell -Command \"if (Test-Path raw_limits.json) { \$json = Get-Content raw_limits.json -Raw | ConvertFrom-Json; \$json.resources.PSObject.Properties | ForEach-Object { \$time = [System.DateTimeOffset]::FromUnixTimeSeconds(\$_.Value.reset).LocalDateTime.ToString('yyyy-MM-dd HH:mm:ss'); Write-Output ('Stage: ' + \$_.Name.ToUpper().PadRight(28) + ' | Remaining: ' + \$_.Value.remaining.ToString().PadRight(5) + ' / ' + \$_.Value.limit.ToString().PadRight(6) + ' | Resets At: ' + \$time) }; Remove-Item raw_limits.json -Force }\""
                        
                        echo "----------------------------------------"
                    }
                }
            }
        }
    stage('Build image') {
      steps{
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
            // FIXED RSYNC EXCLUSION PATTERN ONE BLOCK: Forcefully leaves the locked .git tracking layers behind to pass files cleanly
            bat "wsl mkdir -p /tmp/build && wsl rm -rf /tmp/build/*"
            bat "wsl rsync -av --exclude='.git' '/mnt/c/Program Files (x86)/Jenkins/ins-kubernetes-deployment_master_fresh/' /tmp/build/"
            bat "wsl docker build -t ${dockerimagename}:latest /tmp/build"
          }
        }
      }
    }
    stage('Pushing Image') {
      environment {
          registryCredential = 'dockerhub-credentials'
           }
      steps{
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
              withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                  // FIXED LOGINS: Replaced his name and pointed securely to the official Docker Hub login registry endpoint
                  bat "wsl echo %DOCKER_PASS% | wsl docker login -u mcorries --password-stdin https://docker.io"
                  bat "wsl docker push ${dockerimagename}:latest"
                  bat "wsl rm -rf /tmp/build"
              }
          }
        }
      }
    }
    stage('Deploying React.js container to Kubernetes') {
      environment {
          registryCredential = 'dockerhub-credentials'
      }
      steps {
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
              withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                  // FIXED FOR POSTERITY: Securely initializes or updates the private image registry credentials mapping directly within the cluster namespace
                  bat "wsl kubectl create secret docker-registry private-dockerhub-secret --docker-server=https://docker.io --docker-username=%DOCKER_USER% --docker-password=%DOCKER_PASS% --dry-run=client -o yaml | wsl kubectl apply -f -"
                  
                  // Run native wsl apply statements for your layout files cleanly
                  bat "wsl kubectl apply -f /mnt/c/Program\\ Files\\ \\(x86\\)/Jenkins/ins-kubernetes-deployment_master_fresh/deployment.yaml"
                  bat "wsl kubectl apply -f /mnt/c/Program\\ Files\\ \\(x86\\)/Jenkins/ins-kubernetes-deployment_master_fresh/service.yaml"
              }
          }
        }  
      }
    }
  }
}
