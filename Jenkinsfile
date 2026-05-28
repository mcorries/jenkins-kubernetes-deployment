pipeline {
    agent any
    options {
        skipDefaultCheckout()
    }
    environment {
    GITHUB_CREDS = credentials('my-github-creds')
    dockerimagename = "bravinwasike/react-app"
    dockerImage = ""                                                                                            
    }          
    stages {
        stage('Verify GitHub Auth & Rate Limit') {
            steps {
                script {
                    echo "Checking GitHub authentication for user: ${env.GITHUB_CREDS_USR}"
                    checkout scm
                    echo "----------------------------------------"
                    echo "SUCCESS: Programmatically Retrieved Live Metrics"
                    bat 'curl -s -H "Authorization: token %%GITHUB_CREDS_PSW%%" -H "User-Agent: Jenkins-Pipeline" -H "Accept: application/vnd.github.v3+json" "https://github.com" | findstr "limit remaining reset"'
                    echo "----------------------------------------"
                }
            }
        }
    stage('Build image') {
      steps{
        script {
          dockerImage = docker.build("${dockerimagename}")
        }
      }
    }
    stage('Pushing Image') {
      environment {
          registryCredential = 'dockerhub-credentials'
           }
      steps{
        script {
          docker.withRegistry( 'https://docker.com', registryCredential ) {
            dockerImage.push("latest")
          }
        }
      }
    }
    stage('Deploying React.js container to Kubernetes') {
      steps {
        script {
          kubernetesDeploy(configs: "deployment.yaml", "service.yaml")
        }  
      }
    }
  }
}
