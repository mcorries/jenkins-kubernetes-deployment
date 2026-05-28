pipeline {
    agent any
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
                    echo "Checking GitHub authentication for user: ${env.GITHUB_CREDS_USR}"
                    
                    try {
                        // Securely format the basic authentication credentials string in memory
                        def authString = "${env.GITHUB_CREDS_USR}:${env.GITHUB_CREDS_PSW}"
                        def base64Auth = authString.getBytes().encodeBase64().toString()
                        
                        // Open a native, system-isolated Java network stream straight to the public REST API endpoint
                        def url = new URL("https://github.com")
                        def connection = (HttpURLConnection) url.openConnection()
                        connection.setRequestMethod("GET")
                        connection.setRequestProperty("Authorization", "Basic " + base64Auth)
                        connection.setRequestProperty("User-Agent", "Jenkins-Pipeline")
                        connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                        
                        // Read the active text response block directly out of the stream buffer
                        def responseText = connection.getInputStream().getText()
                        
                        // Programmatically parse the live data into variables in real-time memory
                        def jsonResponse = new groovy.json.JsonSlurper().parseText(responseText)
                        
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
                        error "Pipeline halted: Native API validation check failed. Error detail: ${e.getMessage()}"
                    }
                }
            }
        }

// Bypass pipeline checkout stage until I can ascertain why it is causing GitHub commit failure
/*    stage('Checkout Source') {
      steps {
     // remove: git 'https://github.com'
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
          docker.withRegistry( 'https://github.com', registryCredential ) {
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
