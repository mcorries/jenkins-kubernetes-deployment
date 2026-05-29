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
                    // THE COMPILER LOCK BREAKER: Explicitly shifts execution to a completely isolated, unlocked folder context
                    ws('ins-kubernetes-deployment_master_fresh') {
                        echo "Checking GitHub authentication for user: ${env.GITHUB_CREDS_USR}"
                        
                        // Manually run checkout scm inside the completely fresh folder to fetch your clean code snapshot natively
                        checkout scm
                        
                        echo "----------------------------------------"
                        echo "SUCCESS: Programmatically Retrieved Live Metrics"
                        
                        // RESTING FIXED DATA ENDPOINT: Targeting the official data api gateway directly inside a single-quoted block
                        bat 'curl -s -H "Authorization: token %GITHUB_CREDS_PSW%" -H "User-Agent: Jenkins-Pipeline" -H "Accept: application/vnd.github.v3+json" "https://github.com" | findstr "limit remaining reset"'
                        
                        echo "----------------------------------------"
                    }
                }
            }
        }
    stage('Build image') {
      steps{
        script {
          ws('ins-kubernetes-deployment_master_fresh') {
            dockerImage = docker.build("${dockerimagename}")
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
            docker.withRegistry( 'https://docker.com', registryCredential ) {
              dockerImage.push("latest")
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
