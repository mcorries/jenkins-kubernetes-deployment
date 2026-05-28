node {
    // This securely binds your original credential token string straight out of plain log sight
    withCredentials([usernamePassword(credentialsId: 'my-github-creds', usernameVariable: 'GITHUB_CREDS_USR', passwordVariable: 'GITHUB_CREDS_PSW')]) {
        
        // The next single line automatically binds both username and password variables globally
        // 'my-github-creds' is the ID of your credential stored in Jenkins
        def dockerimagename = "bravinwasike/react-app"
        def dockerImage = ""

        stage('Verify GitHub Auth & Rate Limit') {
            echo "Checking GitHub authentication for user: mcorries"
            
            try {
                // Combine credentials and translate securely to safe Base64 formats in native Java memory
                def authString = "${env.GITHUB_CREDS_USR}:${env.GITHUB_CREDS_PSW}"
                def base64Auth = authString.getBytes("UTF-8").encodeBase64().toString()
                
                // Spin up a raw Java network stream straight to the public REST API endpoint
                def url = new URL("https://github.com")
                def connection = (HttpURLConnection) url.openConnection()
                connection.setRequestMethod("GET")
                connection.setRequestProperty("Authorization", "Basic " + base64Auth)
                connection.setRequestProperty("User-Agent", "Jenkins-Pipeline")
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                
                // Read the active text response block smoothly
                def responseText = connection.getInputStream().getText("UTF-8")
                
                // Native Groovy text parsing processes properties smoothly into memory variables
                def jsonParser = new groovy.json.JsonSlurper()
                def jsonResponse = jsonParser.parseText(responseText)
                
                def limit     = jsonResponse.resources.core.limit
                def remaining = jsonResponse.resources.core.remaining
                def resetTime = jsonResponse.resources.core.reset
                
                echo "----------------------------------------"
                echo "SUCCESS: Authenticated to GitHub REST API via Native Java Hook"
                echo "GitHub API Rate Limit: ${limit}"
                echo "Remaining Requests: ${remaining}"
                echo "Reset Time (Epoch): ${resetTime}"
                echo "----------------------------------------"
                
                if (remaining.toInteger() < 10) {
                    error "Pipeline halted: GitHub API rate limit is critically low (${remaining} remaining)."
                }
            } catch (Exception e) {
                error "Pipeline halted: Native Java API validation check failed. Error detail: ${e.getMessage()}"
            }
        }

        // Bypass pipeline checkout stage until I can ascertain why it is causing GitHub commit failure
        /* stage('Checkout Source') {
            timeout(time: 5, unit: 'MINUTES') {
                checkout scm
            }
        } */

        stage('Build image') {
            dockerImage = docker.build("${dockerimagename}")
        }

        stage('Pushing Image') {
            def registryCredential = 'dockerhub-credentials'
            docker.withRegistry('https://docker.com', registryCredential) {
                dockerImage.push("latest")
            }
        }

        stage('Deploying React.js container to Kubernetes') {
            kubernetesDeploy(configs: "deployment.yaml, service.yaml")
        }
    }
}
