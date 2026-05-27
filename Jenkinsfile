pipeline {
  environment {
    // 'github-user-creds' is the ID of your credential stored in Jenkins
    GITHUB_CREDS = credentials('my-github-creds')
    dockerimagename = "bravinwasike/react-app"
    dockerImage = ""
  }
  agent any
  stages {
      stage('Check GitHub Auth & Rate Limit') {
            steps {
                script {
                    // This queries GitHub using the pipeline's active environment
                    withCredentials([string(credentialsId: 'YOUR_GITHUB_CREDENTIAL_ID', variable: 'GITHUB_TOKEN')]) {
                        def response = sh(script: "curl -s -H 'Authorization: token \$GITHUB_TOKEN' https://github.com", returnStdout: true).trim()
                        echo "Current Rate Limit Status: ${response}"
                    }
                }
            }
        }
// Bypass pipleline checkout stage until I can ascertain why it is causing GitHub commit failure
/*    stage('Checkout Source') {
      steps {
     // remove: git 'https://github.com/mcorries/jenkins-kubernetes-deployment.git'
     // Add following to stop commit stage from hanging and bypass GitHub commit failures 
          timeout(time: 5, unit: 'MINUTES') {
          checkout scm
        }
      }
    }
*/
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
          docker.withRegistry( 'https://registry.hub.docker.com', registryCredential ) {
            dockerImage.push("latest")
          }
        }
      }
    }
    stage('Deploying React.js container to Kubernetes') {
      steps {
        script {
          kubernetesDeploy(configs: "deployment.yaml", 
                                         "service.yaml")
        }
      }
    }
  }
}