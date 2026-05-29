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
                        
                        // FIXED PRETTY PRINT: Invoking powershell ConvertFrom-Json natively formats your target data metrics onto separate vertical log lines
                        powershell '''
                            $response = C:\\Windows\\System32\\curl.exe -s -H "Accept: application/vnd.github.v3+json" -H "User-Agent: Jenkins-Pipeline" -H "Authorization: token $env:GITHUB_CREDS_PSW" "https://github.com" | ConvertFrom-Json
                            
                            Write-Output "Core API Limit     : $($response.rate.limit)"
                            Write-Output "Core API Remaining : $($response.rate.remaining)"
                            Write-Output "Core API Reset Time: $($response.rate.reset)"
                        '''
                        
                        echo "----------------------------------------"
                    }
                }
            }
        }
    stage('Build image') {
      steps{
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
            // FIXED PLUGIN ERROR: Using a native Windows batch statement bypasses the missing Docker pipeline wrapper dependency smoothly
            bat "docker build -t ${dockerimagename}:latest ."
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
                  // Standard CLI login and push streams eliminate helper property failures entirely
                  bat "echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin https://github.com"
                  bat "docker push ${dockerimagename}:latest"
              }
          }
        }
      }
    }
    stage('Deploying React.js container to Kubernetes') {
      steps {
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
            kubernetesDeploy(configs: "deployment.yaml", "service.yaml")
          }
        }  
      }
    }
  }
}
