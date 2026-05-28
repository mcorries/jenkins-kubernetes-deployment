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
                    def output = bat(script: 'curl -s -H "Authorization: token %GITHUB_CREDS_PSW%" -H "User-Agent: Jenkins-Pipeline" -H "Accept: application/vnd.github.v3+json" "https://github.com"', returnStdout: true).trim()
                    if (!output.contains("{") || !output.contains("}")) {
                        error "Pipeline halted: Server did not return a valid data payload.\nRaw Output:\n${output}"
                    }
                    def cleanJsonText = output.substring(output.indexOf("{"), output.lastIndexOf("}") + 1)
                    try {
                        def jsonParser = new groovy.json.JsonSlurper()
                        def jsonResponse = jsonParser.parseText(cleanJsonText)
                        def limit     = jsonResponse.resources.core.limit
                        def remaining = jsonResponse.resources.core.remaining
                        def resetTime = jsonResponse.resources.core.reset
                        echo "----------------------------------------"
                        echo "SUCCESS: Programmatically Retrieved Live Metrics"
                        echo "GitHub API Rate Limit: ${limit}"
                        echo "Remaining Requests: ${remaining}"
                        echo "Reset Time (Epoch): ${resetTime}"
                        echo "----------------------------------------"
                        if (remaining.toInteger() < 10) {
                            error "Pipeline halted: GitHub API rate limit is critically low."
                        }
                    } catch (Exception e) {
                        error "Pipeline halted: Failed to parse GitHub API metrics payload. Error detail: ${e.getMessage()}\nTarget text:\n${cleanJsonText}"
                    }
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