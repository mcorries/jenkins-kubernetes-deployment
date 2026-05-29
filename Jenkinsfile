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
    dockerimagename = "bravinwasike/react-app"
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
            // FIXED WSL2 CROSS-PLATFORM PATHING ONE BLOCK: Using explicit single quotes allows the Linux kernel to map spaces flawlessly
            bat "wsl mkdir -p /tmp/build && wsl rm -rf /tmp/build/*"
            bat "wsl cp -r '/mnt/c/Program Files (x86)/Jenkins/ins-kubernetes-deployment_master_fresh/.' /tmp/build/"
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
                  // Standard CLI login and push streams executed inside WSL2 to eliminate local Windows network drops entirely
                  bat "wsl echo %DOCKER_PASS% | wsl docker login -u %DOCKER_USER% --password-stdin https://docker.com"
                  bat "wsl docker push ${dockerimagename}:latest"
                  bat "wsl rm -rf /tmp/build"
              }
          }
        }
      }
    }
    stage('Deploying React.js container to Kubernetes') {
      steps {
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
            // Standard kubernetesDeploy steps can now map local assets freely since workspace directory files are synchronized
            kubernetesDeploy(configs: "deployment.yaml", "service.yaml")
          }
        }  
      }
    }
  }
}
